from django.shortcuts import render
import os
import joblib
import pandas as pd
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import models
from .models import Match, UserPrediction
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework import generics
from .serializers import RegisterSerializer
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.db.models import Count, Sum, F, FloatField, Q, Case, When
from .models import UserProfile

# === URLs ===
urlpatterns = [
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# === Register View ===
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

# === List Users (Admin Only) ===
@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_users(request):
    users = User.objects.all()
    data = [{"id": u.id, "username": u.username, "email": u.email} for u in users]
    return Response(data, status=status.HTTP_200_OK)

# === Get All Users ===
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    users = User.objects.all().values('id', 'username', 'email', 'date_joined')
    return Response(users)

# === Load Model and Data ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'world_cup_model.pkl'))
scaler = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'scaler.pkl'))
label_encoder = joblib.load(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'model', 'label_encoder.pkl'))

rankings_df = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'fifa_ranking.csv'))
group_stats_df = pd.read_csv(os.path.join(BASE_DIR, 'WorldCupPredictor', 'backend', 'data', 'group_stats.csv'))
rankings_df['rank_date'] = pd.to_datetime(rankings_df['rank_date'])

# === Helper Functions ===
def get_latest_rank(team):
    df = rankings_df[rankings_df['country_full'] == team]
    if df.empty:
        return None
    return df.sort_values('rank_date', ascending=False).iloc[0]['rank']

def prediction_label(pred):
    return {
        0: "Home Win",
        1: "Draw",
        2: "Away Win"
    }.get(pred, "Unknown")

def preprocess_input(data):
    try:
        home = data['home_team'].strip()
        away = data['away_team'].strip()

        home_rank = get_latest_rank(home)
        away_rank = get_latest_rank(away)
        if pd.isna(home_rank) or pd.isna(away_rank):
            return None, f"Ranking data not found for one or both teams: {home}, {away}"

        group_teams = group_stats_df['team'].str.strip().unique()
        if home not in group_teams or away not in group_teams:
            return None, f"Missing group stats for one or both teams: {home}, {away}"

        home_stats = group_stats_df[group_stats_df['team'].str.strip() == home].iloc[0]
        away_stats = group_stats_df[group_stats_df['team'].str.strip() == away].iloc[0]

        rank_diff = home_rank - away_rank
        xg_diff = home_stats['expected_goal_scored'] - away_stats['expected_goal_scored']
        goals_scored_diff = home_stats['goals_scored'] - away_stats['goals_scored']
        goal_diff = home_stats['goal_difference'] - away_stats['goal_difference']
        wins_diff = home_stats['wins'] - away_stats['wins']
        xga_diff = home_stats['exp_goal_conceded'] - away_stats['exp_goal_conceded']

        rank_ratio = home_rank / (away_rank + 1e-6)
        xg_ratio = home_stats['expected_goal_scored'] / (away_stats['expected_goal_scored'] + 1e-6)

        features = [home_rank, away_rank, rank_diff, xg_diff, goals_scored_diff,
                    goal_diff, wins_diff, xga_diff, rank_ratio, xg_ratio]
        return features, None

    except Exception as e:
        return None, str(e)

# === API Endpoints ===

@api_view(['POST'])
def predict_result(request):
    try:
        data = request.data
        features, error = preprocess_input(data)
        if error:
            return Response({'error': error}, status=400)

        feature_names = ['home_rank', 'away_rank', 'rank_diff', 'xg_diff',
                         'goals_scored_diff', 'goal_diff', 'wins_diff', 'xga_diff', 'rank_ratio', 'xg_ratio']
        X_input = pd.DataFrame([features], columns=feature_names)
        X_scaled = scaler.transform(X_input)

        prediction = model.predict(X_scaled)[0]
        predicted_label = label_encoder.inverse_transform([prediction])[0]

        explanation = dict(zip(feature_names, features))

        return Response({
            'prediction': predicted_label,
            'features': explanation
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_prediction(request):
    user = request.user
    data = request.data.get('features')
    user_prediction = data.get('user_prediction')

    if not data or 'home_team' not in data or 'away_team' not in data or not user_prediction:
        return Response({'error': 'Missing required fields'}, status=400)

    home = data['home_team']
    away = data['away_team']

    features, error = preprocess_input(data)
    if error:
        return Response({'error': error}, status=400)

    feature_names = ['home_rank', 'away_rank', 'rank_diff', 'xg_diff',
                     'goals_scored_diff', 'goal_diff', 'wins_diff', 'xga_diff', 'rank_ratio', 'xg_ratio']
    X_input = pd.DataFrame([features], columns=feature_names)
    X_scaled = scaler.transform(X_input)

    prediction = model.predict(X_scaled)[0]
    predicted_label = label_encoder.inverse_transform([prediction])[0]

    correct = user_prediction.strip().lower() == predicted_label.strip().lower()

    match, _ = Match.objects.get_or_create(
        home_team=home,
        away_team=away,
        date=timezone.now().date()
    )

    UserPrediction.objects.create(
        user=user,
        match=match,
        predicted_result=predicted_label,
        actual_result=predicted_label,
        user_prediction=user_prediction,
        correct_prediction=correct
    )

    return Response({
        'prediction': predicted_label,
        'saved': True,
        'correct': correct,
        'actual_result': predicted_label
    })



@api_view(['GET'])
def leaderboard(request):
    users = User.objects.all()
    leaderboard_data = []

    for user in users:
        predictions = UserPrediction.objects.filter(user=user).select_related('match')
        total = predictions.count()
        correct = predictions.filter(correct_prediction=True).count()

        user_correct_real = 0
        ai_correct_real = 0

        for pred in predictions:
            actual = pred.match.result.strip().lower() if pred.match.result else None
            user_pred = pred.user_prediction.strip().lower() if pred.user_prediction else ""
            ai_pred = pred.predicted_result.strip().lower() if pred.predicted_result else ""

            if actual:
                if user_pred == actual:
                    user_correct_real += 1
                if ai_pred == actual:
                    ai_correct_real += 1

        user_accuracy = round((user_correct_real / total) * 100, 2) if total else 0
        ai_accuracy = round((ai_correct_real / total) * 100, 2) if total else 0

        # ✨ מחשבים את better_predictor לפי התוצאה האמיתית
        better = "User" if user_accuracy > ai_accuracy else "AI" if ai_accuracy > user_accuracy else "Equal"

        leaderboard_data.append({
            'username': user.username,
            'total': total,
            'correct': correct,  # נשאר כמו שהיה
            'user_accuracy': user_accuracy,
            'ai_accuracy': ai_accuracy,
            'better_predictor': better
        })

    filtered_data = [entry for entry in leaderboard_data if entry['total'] > 0]
    sorted_data = sorted(filtered_data, key=lambda x: x['user_accuracy'], reverse=True)

    return Response(sorted_data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_predictions(request):
    user = request.user
    predictions = UserPrediction.objects.filter(user=user).select_related('match').order_by('-created_at')

    results = []
    for pred in predictions:
        results.append({
            'home_team': pred.match.home_team,
            'away_team': pred.match.away_team,
            'predicted_result': pred.predicted_result,
            'date': pred.created_at.strftime('%Y-%m-%d %H:%M')
        })

    return Response(results)

@api_view(['GET'])
def group_leaderboard(request):
    profiles = UserProfile.objects.select_related('user')
    group_stats = {}

    for profile in profiles:
        group = profile.group_name
        user = profile.user

        total = UserPrediction.objects.filter(user=user).count()
        correct = UserPrediction.objects.filter(user=user, correct_prediction=True).count()

        if total == 0:
            continue

        if group not in group_stats:
            group_stats[group] = {'total': 0, 'correct': 0}

        group_stats[group]['total'] += total
        group_stats[group]['correct'] += correct

    result = []
    for group, stats in group_stats.items():
        accuracy = round((stats['correct'] / stats['total']) * 100, 2)
        result.append({'group': group, 'total': stats['total'], 'correct': stats['correct'], 'accuracy': accuracy})

    sorted_result = sorted(result, key=lambda x: x['accuracy'], reverse=True)
    return Response(sorted_result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    try:
        profile = user.userprofile
        return Response({
            'username': user.username,
            'email': user.email,
            'full_name': profile.full_name,
            'favorite_team': profile.favorite_team,
            'group_name': profile.group_name,
            'date_joined': user.date_joined,
        })
    except UserProfile.DoesNotExist:
        return Response({'error': 'UserProfile not found'}, status=404)
