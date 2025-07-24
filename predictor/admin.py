from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Match, UserPrediction, UserProfile

admin.site.register(Match)
admin.site.register(UserPrediction)
admin.site.register(UserProfile)
