from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    predict_result,
    save_prediction,
    user_predictions,
    RegisterView,
    LoginView,
    list_users,
    get_users,
    user_profile,
    simulate_tournament_view,
    health_check,
)

urlpatterns = [
    # Auth
    path('login/',    LoginView.as_view(),    name='token_obtain_pair'),
    path('refresh/',  TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),

    # Health
    path('health/',   health_check,           name='health'),

    # Simulation (requires auth)
    path('simulate/',        simulate_tournament_view, name='simulate'),

    # Prediction (requires auth)
    path('predict/',         predict_result,  name='predict'),
    path('save/',            save_prediction, name='save'),
    path('my_predictions/',  user_predictions, name='my-predictions'),

    # User
    path('user/profile/', user_profile, name='user-profile'),
    path('admin/users/',  list_users,   name='list-users'),
    path('users/',        get_users,    name='get-users'),
]
