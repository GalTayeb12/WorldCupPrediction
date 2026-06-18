from django.db import models
from django.contrib.auth.models import User


class Match(models.Model):
    """Kept for backwards compatibility — no longer used by UserPrediction."""
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    date = models.DateField()
    result = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} ({self.date})"


class UserPrediction(models.Model):
    """
    Stores a single-match AI prediction for a logged-in user.
    Fields removed (v3): match FK, actual_result, user_prediction, correct_prediction.
    """
    user             = models.ForeignKey(User, on_delete=models.CASCADE)
    home_team        = models.CharField(max_length=100, default='')
    away_team        = models.CharField(max_length=100, default='')
    predicted_result = models.CharField(max_length=20)
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.home_team} vs {self.away_team} → {self.predicted_result}"


class UserProfile(models.Model):
    user          = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name     = models.CharField(max_length=100, blank=True)
    favorite_team = models.CharField(max_length=100, blank=True)
    group_name    = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.group_name})"
