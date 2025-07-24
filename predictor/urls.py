from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    predict_result,
    leaderboard,
    save_prediction,
    user_predictions,
    RegisterView,
    list_users,
    get_users,
    group_leaderboard,
    user_profile,
)

urlpatterns = [
    path('predict/', predict_result),
    path('leaderboard/', leaderboard),
    path('group-leaderboard/', group_leaderboard, name='group-leaderboard'),

    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('save/', save_prediction),
    path('my_predictions/', user_predictions),
    path('register/', RegisterView.as_view(), name='register'),
    path('admin/users/', list_users, name='list_users'),
    path('users/', get_users, name='get_users'),
    path('user/profile/', user_profile, name='user-profile'),
]
