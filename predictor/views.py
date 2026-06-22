import os
import pickle
import logging
import traceback
import joblib
import numpy as np
import xgboost as xgb
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.models import User
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView

logger = logging.getLogger(__name__)

from .models import UserPrediction, UserProfile
from .serializers import RegisterSerializer
from . import groups_config
from .simulation import simulate_tournament, simulate_and_pick, _elo_name, _fifa_name, _conf_strength

# ── Model & data assets ───────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class _SafeUnpickler(pickle.Unpickler):
    """Unpickler that silently replaces any xgboost class with a harmless stub.
    This lets world_cup_model.pkl load even when the stored XGBClassifier is
    incompatible with the installed xgboost version — we load XGB separately
    from xgb_model.json (the version-stable native format) anyway."""

    class _Stub:
        """Placeholder for the XGBClassifier stored in the pkl — never used."""

    def find_class(self, module, name):
        if module.startswith('xgboost'):
            return self._Stub
        return super().find_class(module, name)


class _EnsemblePredictor:
    """XGB (JSON) + LGB + MLP ensemble with internal StandardScaler."""

    def __init__(self, xgb_model, lgb_model, mlp_model, scaler):
        self._xgb    = xgb_model
        self._lgb    = lgb_model
        self._mlp    = mlp_model
        self._scaler = scaler

    def predict_proba(self, X):
        Xs = self._scaler.transform(X)
        p  = (
            self._xgb.predict_proba(Xs) +
            self._lgb.predict_proba(Xs) +
            self._mlp.predict_proba(Xs)
        ) / 3.0
        p /= p.sum(axis=1, keepdims=True)   # normalise rows to exactly 1.0
        return p


# ── Model loading (wrapped so a failure never prevents Django from starting) ──
_new_model         = None
_new_le            = None
_final_ratings     = None
_new_feature_names = None
model              = None
scaler             = None
label_encoder      = None
rankings_df        = None
group_stats_df     = None
_MODEL_LOAD_ERROR  = None

try:
    # Ensemble bundle — XGBoost stub replaced; real XGB loaded from JSON
    with open(os.path.join(BASE_DIR, 'world_cup_model.pkl'), 'rb') as _f:
        _bundle = _SafeUnpickler(_f).load()

    _xgb_inner = xgb.XGBClassifier()
    _xgb_inner.load_model(os.path.join(BASE_DIR, 'xgb_model.json'))

    _new_model         = _EnsemblePredictor(_xgb_inner, _bundle['lgb_model'], _bundle['mlp'], _bundle['scaler'])
    _new_le            = _bundle['le']
    _final_ratings     = _bundle['final_ratings']
    _new_feature_names = _bundle['features']

    # Legacy assets (used by save_prediction / preprocess_input)
    model         = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'world_cup_model.pkl'))
    scaler        = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'scaler.pkl'))
    label_encoder = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'label_encoder.pkl'))

    rankings_df    = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'fifa_ranking.csv'))
    group_stats_df = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'group_stats.csv'))
    rankings_df['rank_date'] = pd.to_datetime(rankings_df['rank_date'])

    groups_config.validate_groups(group_stats_df, rankings_df, strict=False)

except Exception as _e:
    import traceback
    _MODEL_LOAD_ERROR = traceback.format_exc()
    print(f"[predictor] WARNING: ML model failed to load — predict/simulate disabled.\n{_MODEL_LOAD_ERROR}")


# ── New-model helpers ─────────────────────────────────────────────────────────

def _get_fifa_stats(team):
    """Return (rank, total_points) for the team's most recent ranking entry."""
    df = rankings_df[rankings_df['country_full'] == _fifa_name(team)]
    if df.empty:
        return 50, 0.0
    row = df.sort_values('rank_date', ascending=False).iloc[0]
    return int(row['rank']), float(row['total_points'])

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_latest_rank(team):
    df = rankings_df[rankings_df['country_full'] == team]
    if df.empty:
        return None
    return df.sort_values('rank_date', ascending=False).iloc[0]['rank']


def preprocess_input(data):
    """
    Build feature vector for the model from request data.
    Returns (features_list, None) on success or (None, error_str) on failure.
    """
    try:
        home = data['home_team'].strip()
        away = data['away_team'].strip()

        # Reject requests where neither team is in any official group
        # (allows cross-group knockout matches; blocks truly unknown teams)
        home_group = groups_config.get_group_of(home)
        away_group = groups_config.get_group_of(away)
        if home_group is None and away_group is None:
            return None, f"Neither '{home}' nor '{away}' are recognised tournament teams"

        home_rank = get_latest_rank(home)
        away_rank = get_latest_rank(away)
        if pd.isna(home_rank) or pd.isna(away_rank):
            return None, f"Ranking data not found for: {home}, {away}"

        group_teams = group_stats_df['team'].str.strip().unique()
        if home not in group_teams or away not in group_teams:
            return None, f"Missing group stats for: {home}, {away}"

        hs = group_stats_df[group_stats_df['team'].str.strip() == home].iloc[0]
        as_ = group_stats_df[group_stats_df['team'].str.strip() == away].iloc[0]

        features = [
            home_rank, away_rank,
            home_rank - away_rank,
            hs['expected_goal_scored']  - as_['expected_goal_scored'],
            hs['goals_scored']          - as_['goals_scored'],
            hs['goal_difference']       - as_['goal_difference'],
            hs['wins']                  - as_['wins'],
            hs['exp_goal_conceded']     - as_['exp_goal_conceded'],
            home_rank / (away_rank + 1e-6),
            hs['expected_goal_scored']  / (as_['expected_goal_scored'] + 1e-6),
        ]
        return features, None

    except Exception as e:
        return None, str(e)


def run_model(features):
    """Scale features and return predicted label string."""
    FEATURE_NAMES = [
        'home_rank', 'away_rank', 'rank_diff', 'xg_diff',
        'goals_scored_diff', 'goal_diff', 'wins_diff',
        'xga_diff', 'rank_ratio', 'xg_ratio',
    ]
    X = pd.DataFrame([features], columns=FEATURE_NAMES)
    X_scaled = scaler.transform(X)
    pred = model.predict(X_scaled)[0]
    return label_encoder.inverse_transform([pred])[0]


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error("Error in RegisterView:\n%s", traceback.format_exc())
            return Response({"error": str(e)}, status=500)


class LoginView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.error("Error in LoginView:\n%s", traceback.format_exc())
            return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Quick endpoint to verify DB connectivity and model status."""
    from django.db import connection
    result = {
        "status": "ok",
        "model_loaded":    _new_model is not None,
        "rankings_loaded": rankings_df is not None,
        "le_loaded":       _new_le is not None,
        "ratings_loaded":  _final_ratings is not None,
    }
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        result["db"] = "ok"
    except Exception as e:
        result["db"] = f"ERROR: {e}"
        result["status"] = "degraded"
    if _MODEL_LOAD_ERROR:
        result["model_error"] = _MODEL_LOAD_ERROR
        result["status"] = "degraded"
    return Response(result)


# ── Predict (requires auth per CHANGES_v3) ────────────────────────────────────

def _build_features(team_a_key: str, team_b_key: str) -> dict:
    """
    Build the feature dict treating team_a as 'home' and team_b as 'away'.
    neutral=1 is always set — World Cup matches have no real home side.
    """
    a_elo  = float(_final_ratings.get(team_a_key, 1500.0))
    b_elo  = float(_final_ratings.get(team_b_key, 1500.0))
    a_rank, _ = _get_fifa_stats(team_a_key)
    b_rank, _ = _get_fifa_stats(team_b_key)
    return {
        'elo_diff':           a_elo - b_elo,
        'home_elo':           a_elo,
        'away_elo':           b_elo,
        'fifa_rank_diff':     a_rank - b_rank,
        'form_points_diff':   0.0,
        'form_ga_diff':       0.0,
        'h2h_home_winrate':   0.5,
        'streak_diff':        0.0,
        'conf_strength_diff': _conf_strength(team_a_key) - _conf_strength(team_b_key),
        'importance':         4,
        'neutral':            1,          # always neutral — no real home team
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_result(request):
    if _new_model is None:
        return Response(
            {'error': f'ML model unavailable: {_MODEL_LOAD_ERROR}'},
            status=503,
        )

    home = (request.data.get('home_team') or '').strip()
    away = (request.data.get('away_team') or '').strip()

    if not home or not away:
        return Response({'error': 'home_team and away_team are required'}, status=400)

    home_key = _elo_name(home)
    away_key = _elo_name(away)

    cls_list = list(_new_le.classes_)   # ['away', 'draw', 'home']
    ai, di, hi = cls_list.index('away'), cls_list.index('draw'), cls_list.index('home')

    try:
        # Forward prediction: home as team A
        feat_fwd = _build_features(home_key, away_key)
        X_fwd    = pd.DataFrame([[feat_fwd[f] for f in _new_feature_names]],
                                columns=_new_feature_names)
        p_fwd    = _new_model.predict_proba(X_fwd)[0]

        # Reverse prediction: away as team A (same match, roles swapped)
        feat_rev = _build_features(away_key, home_key)
        X_rev    = pd.DataFrame([[feat_rev[f] for f in _new_feature_names]],
                                columns=_new_feature_names)
        p_rev    = _new_model.predict_proba(X_rev)[0]

        # Combine symmetrically so team order doesn't change the result:
        #   'home wins' in fwd  ≡  'away wins' in rev  (same team wins both times)
        p_home = (p_fwd[hi] + p_rev[ai]) / 2.0
        p_draw = (p_fwd[di] + p_rev[di]) / 2.0
        p_away = (p_fwd[ai] + p_rev[hi]) / 2.0

        # Normalise to exactly 1.0
        total  = p_home + p_draw + p_away
        p_home /= total
        p_draw /= total
        p_away /= total

    except Exception as e:
        return Response({'error': str(e)}, status=500)

    label_map = {
        'home': f'{home} Win',
        'draw': 'Draw',
        'away': f'{away} Win',
    }
    if p_home >= p_draw and p_home >= p_away:
        pred_cls = 'home'
    elif p_away >= p_home and p_away >= p_draw:
        pred_cls = 'away'
    else:
        pred_cls = 'draw'

    ph = round(float(p_home), 4)
    pd_ = round(float(p_draw), 4)
    pa = round(float(p_away), 4)

    # Persist every prediction so it appears in the user's history
    try:
        UserPrediction.objects.create(
            user=request.user,
            home_team=home,
            away_team=away,
            predicted_result=label_map[pred_cls],
            p_home=ph,
            p_draw=pd_,
            p_away=pa,
        )
    except Exception:
        pass   # never block the response if the DB write fails

    return Response({
        'prediction': label_map[pred_cls],
        'probabilities': {
            'home': ph,
            'draw': pd_,
            'away': pa,
        },
    })


# ── Save prediction ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_prediction(request):
    """
    Save the AI prediction for a match to the user's history.
    Body: { home_team, away_team }
    The server re-runs the model — no client-supplied prediction is trusted.
    """
    home = (request.data.get('home_team') or '').strip()
    away = (request.data.get('away_team') or '').strip()

    if not home or not away:
        return Response({'error': 'home_team and away_team are required'}, status=400)

    features, error = preprocess_input({'home_team': home, 'away_team': away})
    if error:
        return Response({'error': error}, status=400)

    try:
        predicted_label = run_model(features)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    UserPrediction.objects.create(
        user=request.user,
        home_team=home,
        away_team=away,
        predicted_result=predicted_label,
    )

    return Response({'prediction': predicted_label, 'saved': True})


# ── User predictions history ──────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_predictions(request):
    predictions = (
        UserPrediction.objects
        .filter(user=request.user)
        .order_by('-created_at')
    )
    results = [
        {
            'home_team':        p.home_team,
            'away_team':        p.away_team,
            'predicted_result': p.predicted_result,
            'p_home':           p.p_home,
            'p_draw':           p.p_draw,
            'p_away':           p.p_away,
            'date':             p.created_at.strftime('%Y-%m-%d %H:%M'),
        }
        for p in predictions
    ]
    return Response(results)


# ── Profile ───────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    try:
        profile = request.user.userprofile
    except UserProfile.DoesNotExist:
        return Response({'error': 'UserProfile not found'}, status=404)

    return Response({
        'username':     request.user.username,
        'email':        request.user.email,
        'full_name':    profile.full_name,
        'favorite_team':profile.favorite_team,
        'group_name':   profile.group_name,
        'date_joined':  request.user.date_joined,
    })


# ── Simulate tournament ───────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_tournament_view(request):
    """
    POST /api/simulate/
    Runs 200 full stochastic World Cup simulations (reduced from 1,000 to stay
    within Render free-tier request timeout), picks a representative bracket
    whose champion is in the Top-7 by championship probability, and returns
    that bracket together with the true MC championship odds.
    """
    if _new_model is None or rankings_df is None or _new_le is None or _final_ratings is None:
        return Response(
            {'error': f'ML model or data not fully loaded. Load error: {_MODEL_LOAD_ERROR}'},
            status=503,
        )

    try:
        logger.info("Starting simulation (n=50)...")
        result, championship_odds = simulate_and_pick(
            _new_model, _new_le, _final_ratings, _new_feature_names,
            rankings_df, n=50, top_k=7,
        )
        result['championship_odds'] = championship_odds
        logger.info("Simulation complete.")
    except Exception as e:
        logger.error("Simulation error:\n%s", traceback.format_exc())
        return Response({'error': str(e), 'detail': traceback.format_exc()}, status=500)

    return Response(result)


# ── Admin ─────────────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    users = User.objects.all().values('id', 'username', 'email', 'date_joined')
    return Response(list(users))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    users = User.objects.all().values('id', 'username', 'email', 'date_joined')
    return Response(list(users))
