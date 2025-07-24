from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    favorite_team = serializers.CharField(write_only=True)
    group_name = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'full_name', 'favorite_team', 'group_name')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        full_name = validated_data.pop('full_name')
        favorite_team = validated_data.pop('favorite_team')
        group_name = validated_data.pop('group_name')

        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(
            user=user,
            full_name=full_name,
            favorite_team=favorite_team,
            group_name=group_name
        )
        return user
