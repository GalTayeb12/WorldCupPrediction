import os
import joblib
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status, generics
from django.contrib.auth.models import User
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import UserPrediction, UserProfile
from .serializers import RegisterSerializer

# ── Model & data assets ───────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

model         = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'world_cup_model.pkl'))
scaler        = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'scaler.pkl'))
label_encoder = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'label_encoder.pkl'))

rankings_df    = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'fifa_ranking.csv'))
group_stats_df = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'group_stats.csv'))
rankings_df['rank_date'] = pd.to_datetime(rankings_df['rank_date'])

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


# ── Predict (requires auth per CHANGES_v3) ────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_result(request):
    features, error = preprocess_input(request.data)
    if error:
        return Response({'error': error}, status=400)

    try:
        predicted_label = run_model(features)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    FEATURE_NAMES = [
        'home_rank', 'away_rank', 'rank_diff', 'xg_diff',
        'goals_scored_diff', 'goal_diff', 'wins_diff',
        'xga_diff', 'rank_ratio', 'xg_ratio',
    ]
    return Response({
        'prediction': predicted_label,
        'features': dict(zip(FEATURE_NAMES, features)),
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
