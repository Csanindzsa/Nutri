from rest_framework import serializers
from .models import *
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
    id = serializers.IntegerField()
    # restaurant = serializers.StringRelatedField()
    name = serializers.CharField(max_length=255)
    macro_table = serializers.JSONField()
    calories = serializers.IntegerField()
    is_organic = serializers.BooleanField()
    is_gluten_free = serializers.BooleanField()
    is_alcohol_free = serializers.BooleanField()
    is_lactose_free = serializers.BooleanField()
    image = serializers.ImageField()
    # ingredients = serializers.StringRelatedField(many=True)
    # approved_supervisors = serializers.StringRelatedField(many=True)
    is_approved = serializers.BooleanField()
    
    class Meta:
        model = Food
        fields = [
            'id', 'restaurant', 'name', 'macro_table', 'calories', 'is_organic',
            'is_gluten_free', 'is_alcohol_free', 'is_lactose_free', 'image',
            'ingredients',
            # 'approved_supervisors',
            'is_approved',
        ]

class FoodChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodChange
        fields = '__all__'