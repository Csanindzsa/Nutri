from rest_framework import serializers
from .models import *
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    # Password should be write-only
    password = serializers.CharField(write_only=True)

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
    # Add fields for latitude and longitude to directly handle location data
    latitude = serializers.FloatField(required=False, write_only=True)
    longitude = serializers.FloatField(required=False, write_only=True)
    cuisine = serializers.CharField(max_length=255)
    description = serializers.CharField()

    class Meta:
        model = Restaurant
        fields = '__all__'

    def create(self, validated_data):
        # Extract location data if provided
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        # Create the restaurant
        restaurant = Restaurant.objects.create(**validated_data)

        # If location data is provided, create a Location object with restaurant FK
        if latitude is not None and longitude is not None:
            Location.objects.create(
                restaurant=restaurant,  # This sets the restaurant_id
                latitude=latitude,
                longitude=longitude
            )

        return restaurant

    def update(self, instance, validated_data):
        # Extract location data if provided
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        # Update restaurant fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If location data is provided, update or create the location
        if latitude is not None and longitude is not None:
            # First check if there's an existing location for this restaurant
            existing_location = Location.objects.filter(
                restaurant=instance).first()

            if existing_location:
                # Update existing location
                existing_location.latitude = latitude
                existing_location.longitude = longitude
                existing_location.save()
            else:
                # Create new location with restaurant FK
                Location.objects.create(
                    restaurant=instance,
                    latitude=latitude,
                    longitude=longitude
                )

        return instance


class LocationSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'latitude', 'longitude', 'restaurant_id']

    def get_restaurant_name(self, obj):
        return obj.restaurant.name if obj.restaurant else None


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'


class FoodSerializer(serializers.ModelSerializer):
    # id = serializers.IntegerField()
    # restaurant = serializers.StringRelatedField()
    restaurant_name = serializers.CharField(
        source="restaurant.name", read_only=True)
    created_by = serializers.CharField(
        source="created_by.username", read_only=True)
    created_date = serializers.DateTimeField(read_only=True)
    name = serializers.CharField(max_length=255)
    macro_table = serializers.JSONField()
    is_organic = serializers.BooleanField()
    is_gluten_free = serializers.BooleanField()
    is_alcohol_free = serializers.BooleanField()
    is_lactose_free = serializers.BooleanField()
    # Modify this line to make image optional
    image = serializers.ImageField(required=False)
    # Make this read-only as it's calculated
    hazard_level = serializers.FloatField(read_only=True)
    # ingredients = serializers.StringRelatedField(many=True)
    # approved_supervisors = serializers.StringRelatedField(many=True)
    is_approved = serializers.BooleanField()

    class Meta:
        model = Food
        fields = [
            'id', 'restaurant', 'restaurant_name', 'name', 'macro_table', 'serving_size', 'is_organic',
            'is_gluten_free', 'is_alcohol_free', 'is_lactose_free', 'image',
            'ingredients', 'hazard_level', 'is_approved',
            'created_by', 'created_date',
        ]


class FoodChangeSerializer(serializers.ModelSerializer):
    new_approved_supervisors_count = serializers.IntegerField(read_only=True)
    new_restaurant_name = serializers.CharField(
        source="new_restaurant.name", read_only=True)
    new_hazard_level = serializers.FloatField(read_only=True)
    updated_by = serializers.CharField(
        source="updated_by.email", read_only=True)  # Use email for updated_by
    reason = serializers.CharField(required=False, allow_blank=True)
    date = serializers.DateField()
    updated_date = serializers.DateTimeField(
        read_only=True)  # Add this field explicitly

    class Meta:
        model = FoodChange
        fields = [
            'id',
            'is_deletion',
            'old_version',
            'new_restaurant',
            'new_restaurant_name',
            'new_name',
            'new_macro_table',
            'new_serving_size',
            'new_is_organic',
            'new_is_gluten_free',
            'new_is_alcohol_free',
            'new_is_lactose_free',
            'new_ingredients',
            'new_image',
            'new_approved_supervisors',
            'new_approved_supervisors_count',
            'new_hazard_level',
            'reason',
            'date',
            'updated_by',
            'updated_date',  # Include this field in the serialized output
        ]


class ConfirmationTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfirmationToken
        fields = ["code"]


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = '__all__'
