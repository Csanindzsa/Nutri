from rest_framework import serializers
from .models import User, Restaurant, Ingredient, Food, ExactLocation, FoodChange
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  # Password should be write-only

    class Meta:
        model = User
        fields = ['email', 'username', 'password']

    def create(self, validated_data):
        # Hash password before saving
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)  # Hash the password
        user.save()
        return user
    
    

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add custom claims
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['is_supervisor'] = self.user.is_supervisor

        return data
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_supervisor'] = user.is_supervisor

        return token


class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = '__all__'

class ExactLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExactLocation
        fields = ['city_name', 'postal_code', 'street_name', 'street_type', 'house_number', 'restaurant_id']

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class FoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'

class FoodChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodChange
        fields = '__all__'