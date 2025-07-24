from django.db import models
from django.contrib.auth.models import User

class Match(models.Model):
    home_team = models.CharField(max_length=100)
    away_team = models.CharField(max_length=100)
    date = models.DateField()
    result = models.CharField(max_length=20)  # Optional - או תוצאה אמיתית אם יש

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} ({self.date})"

class UserPrediction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    predicted_result = models.CharField(max_length=20)
    actual_result = models.CharField(max_length=20, null=True, blank=True)
    user_prediction = models.CharField(max_length=20, null=True, blank=True)
    correct_prediction = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} → {self.predicted_result}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=100, blank=True)
    favorite_team = models.CharField(max_length=100, blank=True)
    group_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.user.username} ({self.group_name})"
