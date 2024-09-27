from rest_framework import routers, serializers, viewsets

from .models import User

class UserSerializer(serializers.Serializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 
                  'subscription_plan', 'product_history', 'ingredient_history', 'favorite_foods', 'favourite_shops', 'diet_type']