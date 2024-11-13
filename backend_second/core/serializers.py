from rest_framework import routers, serializers, viewsets
from django.contrib.auth.hashers import make_password

from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = '__all__'
        # fields = ['username', 'email', 'password', 
        #           'subscription_plan', 'product_history', 'ingredient_history', 'favorite_foods', 'favourite_shops', 'diet_type']
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        user = User(**validated_data)
        user.save()
        return user