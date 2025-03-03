import json
import os
import dotenv
import random
import string

from django.db import IntegrityError
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings

from .serializers import *
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from django.core.mail import send_mail, BadHeaderError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import logging
import smtplib

logger = logging.getLogger(__name__)

dotenv.load_dotenv()
# from .tokens import email_confirmation_token
# Create your views here.


class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer

    def generate_token(self, length=32):
        """Generate a random 32-character token."""
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for skibidi in range(length))

    def post(self, request, *args, **kwargs):
        # Step 1: Validate and create the user
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Save user without sending email confirmation
            user = serializer.save()

            # Step 2: Generate a 32-character token for confirmation
            token = self.generate_token()

            # Step 3: Create and save the ConfirmationToken model
            confirmation_token = ConfirmationToken.objects.create(
                code=token,
                user_id=user
            )

            confirmation_token.save()

            # You can send an email to the user with this token if needed.
            # Email sending logic would be here (omitted for brevity).
            subject = 'Please confirm your email address'
            message = f'Click here to confirm your email: http://localhost:5173/confirm-email/%7Bconfirmation_token.code%7D'
            from_email = os.getenv("EMAIL")  # Use the email from your settings
            recipient_list = [user.email]  # The recipient's email address

            send_mail(subject, message, from_email, recipient_list)

            return Response({
                "message": "User created successfully, a confirmation token has been generated."
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConfirmEmail(generics.CreateAPIView):
    serializer_class = ConfirmationTokenSerializer

    def post(self, request, *args, **kwargs):
        # Step 1: Extract token from the request (can be in the body or query parameters)
        # Assuming the token is sent in the body
        token = request.data.get("token")

        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Find the token in the ConfirmationToken model
        confirmation_token = get_object_or_404(ConfirmationToken, code=token)

        # Step 3: Check if the user is already active (avoid reactivating)
        user = confirmation_token.user_id

        if user.is_active:
            return Response({"detail": "User is already active."}, status=status.HTTP_400_BAD_REQUEST)

        # Step 4: Activate the user and save changes
        user.is_active = True
        user.save()

        # Optionally, you can delete or expire the token after successful confirmation
        confirmation_token.delete()  # Remove the token once it’s used (optional)

        # Step 5: Return a success response
        return Response({
            "message": "User has been successfully activated."
        }, status=status.HTTP_200_OK)


class EditUserView(generics.UpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Get the user object to be updated (the authenticated user)."""
        return self.request.user

    def get_serializer(self, *args, **kwargs):
        """Override to use a custom serializer for editing only allowed fields."""
        kwargs['partial'] = True  # Allow partial updates
        return super().get_serializer(*args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Update the user with the provided data, excluding protected fields.
        """
        # Get a copy of the data to avoid modifying the request directly
        data = request.data.copy()

        # Remove protected fields from the data if present
        protected_fields = ['is_active', 'is_supervisor', 'is_staff']
        for field in protected_fields:
            if field in data:
                data.pop(field)

        # Handle password separately if it's being updated
        password = data.pop('password', None)

        # Update the user instance with the filtered data
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Update password if provided
        if password:
            instance.set_password(password)
            instance.save()

        # Generate new tokens using the custom serializer
        refresh = CustomTokenObtainPairSerializer.get_token(instance)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            "message": "User information updated successfully.",
            "user": serializer.data,
            "tokens": {
                "access": access_token,
                "refresh": refresh_token,
            }
        }, status=status.HTTP_200_OK)


class DeleteUserView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Get the user object to be deleted (the authenticated user)."""
        return self.request.user

    def delete(self, request, *args, **kwargs):
        """Handle the user deletion with a confirmation step."""
        user = self.get_object()

        # Perform the deletion
        user.delete()

        return Response({
            "message": "Your account has been successfully deleted."
        }, status=status.HTTP_200_OK)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    authentication_classes = []  # must have this line


class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    authentication_classes = []


# class ListViewExactLocations(generics.ListAPIView):
#     queryset = ExactLocation.objects.all()
#     serializer_class = ExactLocationSerializer

class ListViewLocations(generics.ListAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    authentication_classes = []


class IngredientListView(generics.ListAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    authentication_classes = []


class FoodListView(generics.ListAPIView):
    queryset = Food.objects.filter(is_approved=True)
    serializer_class = FoodSerializer
    authentication_classes = []


class FoodCreateView(generics.CreateAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            # Log the incoming request data for debugging
            logger.debug(f"Incoming request data: {request.data}")

            # Perform the default create logic
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            food = self.perform_create(serializer)

            # Calculate the hazard level based on the ingredients
            food.calculate_hazard_level()

            # Log the successful creation
            logger.info(f"Food created successfully: {serializer.data}")

            # Return the response with the created data
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except ValidationError as e:
            # Log validation errors
            logger.error(f"Validation error: {e.detail}")
            return Response({"error": "Validation failed", "details": e.detail}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error during food creation: {str(e)}")
            return Response({"error": "An unexpected error occurred", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        # Set is_approved to False upon creation
        serializer.validated_data['is_approved'] = False

        # Save the Food instance
        food = serializer.save()

        # If the user is a supervisor, add them to the approved_users
        if self.request.user.is_supervisor:
            food.approved_supervisors.add(self.request.user)

        # Save the updated Food instance
        food.save()

        # Return the food instance for further processing
        return food


class GetApprovableFoods(generics.ListAPIView):
    queryset = Food.objects.filter(is_approved=False).select_related(
        'restaurant')  # Optimize query
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        for i, food in enumerate(queryset):
            data[i]['approved_supervisors_count'] = food.approved_supervisors.filter(
                is_supervisor=True).count()
            # Add restaurant name
            data[i]['restaurant_name'] = food.restaurant.name
            data[i]['approved_supervisors'] = list(food.approved_supervisors.filter(
                is_supervisor=True).values('id', 'username'))  # Add approved supervisors list

        return Response(data)


class AcceptFood(generics.UpdateAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        # Get the food instance
        food = self.get_object()

        # Check if the user is a supervisor
        if not request.user.is_supervisor:
            return Response(
                {"detail": "Only supervisors can approve food items."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the user has already approved this food item
        if food.approved_supervisors.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You have already approved this food item."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Add the user to the approved supervisors
        food.approved_supervisors.add(request.user)

        food.save()

        approved_count = food.approved_supervisors.count()

        # Define the threshold for approval
        REQUIRED_APPROVALS = 10

        # If the threshold is met, mark the food as approved
        if approved_count >= REQUIRED_APPROVALS:
            food.is_approved = True
        food.save()

        # Return a success response
        return Response(
            {"detail": "Food item approved successfully."},
            status=status.HTTP_200_OK
        )


def convert_value(value, target_type):
    """
    Convert the given value to the specified target type.
    Supports: bool, int, float, str.
    """
    if target_type == bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ["true", "1", "yes"]
        return False  # Default to False if conversion fails
    elif target_type == int:
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0  # Default to 0 if conversion fails
    elif target_type == float:
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0  # Default to 0.0 if conversion fails
    return value  # Return original value if no conversion is needed


def parse_json(value):
    """Ensure the value is properly stored as JSON, not a string."""
    if isinstance(value, dict):
        return value  # Already a JSON object
    if isinstance(value, str):
        try:
            # Convert JSON string to actual JSON object
            return json.loads(value)
        except json.JSONDecodeError:
            return {}  # Return empty JSON if invalid
    return {}  # Default to empty JSON if value is not vali


class CreateFoodChange(generics.CreateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        print(f"ingredients: {request.data.get('ingredients')}")
        try:
            # Validate food_id
            food_id = request.data.get("food_id")
            if not food_id:
                logger.error("food_id is required.")
                return Response({"error": "food_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch the food object
            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                logger.error(f"Food with id {food_id} does not exist.")
                return Response({"error": f"Food with id {food_id} does not exist."}, status=status.HTTP_404_NOT_FOUND)

            # Extract new data
            new_data = request.data
            logger.debug("new data: %s", new_data)

            # Validate and parse ingredients
            # Default to an empty JSON array if not provided
            ingredients = new_data.get("ingredients", "[]")
            try:
                # Parse the JSON-encoded ingredients string into a Python list
                ingredient_ids = json.loads(ingredients)
                if not isinstance(ingredient_ids, list):
                    return Response(
                        {"error": "ingredients must be a JSON-encoded array."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except json.JSONDecodeError:
                return Response(
                    {"error": "ingredients must be a valid JSON-encoded array."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Convert ingredient IDs to integers and validate
            valid_ingredient_ids = []
            invalid_ingredient_ids = []

            for ing_id in ingredient_ids:
                try:
                    # Ensure the ingredient ID is a valid integer
                    ing_id = int(ing_id)
                    # Check if the ingredient exists in the database
                    Ingredient.objects.get(id=ing_id)
                    valid_ingredient_ids.append(ing_id)
                except (ValueError, TypeError):
                    # Handle cases where ing_id is not a valid integer
                    invalid_ingredient_ids.append(ing_id)
                except ObjectDoesNotExist:
                    # Handle cases where the ingredient does not exist
                    invalid_ingredient_ids.append(ing_id)

            # If there are invalid ingredient IDs, return an error
            if invalid_ingredient_ids:
                return Response(
                    {"error": f"Ingredients with IDs {', '.join(map(str, invalid_ingredient_ids))} are invalid or do not exist."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create the FoodChange object
            try:
                food_change = FoodChange.objects.create(
                    old_version=food,
                    is_deletion=convert_value(
                        new_data.get("is_deletion", False), bool),
                    new_restaurant=food.restaurant,
                    new_name=new_data.get("name", food.name),
                    new_serving_size=convert_value(new_data.get(
                        "serving_size", food.serving_size), float),
                    new_macro_table=parse_json(new_data.get(
                        "macro_table", food.macro_table)),
                    new_is_organic=convert_value(new_data.get(
                        "is_organic", food.is_organic), bool),
                    new_is_gluten_free=convert_value(new_data.get(
                        "is_gluten_free", food.is_gluten_free), bool),
                    new_is_alcohol_free=convert_value(new_data.get(
                        "is_alcohol_free", food.is_alcohol_free), bool),
                    new_is_lactose_free=convert_value(new_data.get(
                        "is_lactose_free", food.is_lactose_free), bool),
                    new_image=new_data.get("image", food.image),
                    new_is_approved=False,
                )
            except ValidationError as e:
                logger.error(
                    f"Validation error while creating FoodChange: {e}")
                return Response({"error": f"Validation error: {e}"}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error creating FoodChange: {e}")
                return Response({"error": f"Error creating FoodChange: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Set valid ingredients if provided
            if valid_ingredient_ids:
                try:
                    food_change.new_ingredients.set(valid_ingredient_ids)
                    # Calculate the hazard level based on the new ingredients
                    food_change.calculate_new_hazard_level()
                except Exception as e:
                    logger.error(f"Error setting new_ingredients: {e}")
                    return Response({"error": f"Error setting new_ingredients: {e}"}, status=status.HTTP_400_BAD_REQUEST)

            # Return success response
            return Response({"message": "Food change request created successfully."}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Unexpected error in CreateFoodChange: {e}")
            return Response({"error": f"Unexpected error: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FoodChangeUpdateListView(generics.ListAPIView):
    # queryset = FoodChange.objects.filter(is_deletion=False, new_is_approved=False)
    serializer_class = FoodChangeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Annotate the queryset with the count of new_approved_supervisors
        queryset = FoodChange.objects.filter(is_deletion=False, new_is_approved=False).annotate(
            new_approved_supervisors_count=Count('new_approved_supervisors')
        )
        return queryset


class CreateFoodRemoval(generics.CreateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, food_id, *args, **kwargs):
        food = get_object_or_404(Food, id=food_id)

        try:
            # Check if a removal proposal already exists for this food item
            existing_proposal = FoodChange.objects.filter(
                old_version=food, is_deletion=True).first()
            if existing_proposal:
                raise IntegrityError(
                    "A removal proposal is already active for this food item.")

            # Create the new food change record
            food_change = FoodChange.objects.create(
                old_version=food,
                is_deletion=True,
                new_restaurant=food.restaurant,
                new_name=food.name,
                new_macro_table=food.macro_table,
                new_is_organic=food.is_organic,
                new_is_gluten_free=food.is_gluten_free,
                new_is_alcohol_free=food.is_alcohol_free,
                new_is_lactose_free=food.is_lactose_free,
                new_image=food.image,
                new_is_approved=False,
            )

            food_change.new_ingredients.set(food.ingredients.all())

            if request.user.is_supervisor:
                food_change.new_approved_supervisors.add(request.user)

            return Response({"message": "Food deletion request created successfully."}, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            # Handle the integrity error by sending a specific error message
            return Response({"error": "A removal proposal is already active for this food item."}, status=status.HTTP_400_BAD_REQUEST)


class FoodChangeDeletionListView(generics.ListAPIView):
    serializer_class = FoodChangeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Annotate the queryset with the count of new_approved_supervisors
        queryset = FoodChange.objects.filter(is_deletion=True, new_is_approved=False).annotate(
            new_approved_supervisors_count=Count('new_approved_supervisors')
        )
        return queryset


class ApproveProposal(generics.UpdateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        # Retrieve the FoodChange instance
        food_change = get_object_or_404(FoodChange, id=kwargs.get('pk'))

        # Check if the user is a supervisor
        if not request.user.is_supervisor:
            return Response({"error": "Only supervisors can approve food changes."}, status=status.HTTP_403_FORBIDDEN)

        # Add the supervisor to the new_approved_supervisors
        food_change.new_approved_supervisors.add(request.user)

        # Check if the FoodChange has enough approvals to be marked as approved
        required_approvals = 20  # Example: require 20 supervisor approvals
        if food_change.new_approved_supervisors.count() >= required_approvals:
            # Mark the FoodChange as approved
            food_change.new_is_approved = True
            food_change.save()

            # Retrieve and delete the original Food object (if old_version is not null)
            if food_change.old_version:
                try:
                    original_food = Food.objects.get(
                        id=food_change.old_version.id)

                    if not food_change.is_deletion:
                        # Update the food with new values if this is not a deletion request
                        original_food.name = food_change.new_name
                        original_food.restaurant = food_change.new_restaurant
                        original_food.macro_table = food_change.new_macro_table
                        original_food.serving_size = food_change.new_serving_size
                        original_food.is_organic = food_change.new_is_organic
                        original_food.is_gluten_free = food_change.new_is_gluten_free
                        original_food.is_alcohol_free = food_change.new_is_alcohol_free
                        original_food.is_lactose_free = food_change.new_is_lactose_free

                        if food_change.new_image:
                            original_food.image = food_change.new_image

                        # Update ingredients
                        original_food.ingredients.set(
                            food_change.new_ingredients.all())

                        # Calculate the hazard level based on the new ingredients
                        original_food.calculate_hazard_level()

                        original_food.save()
                    else:
                        # Delete the original Food object if this is a deletion request
                        original_food.delete()

                except Food.DoesNotExist:
                    # Handle the case where the original Food object no longer exists
                    return Response(
                        {"error": "The original Food object does not even exist."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

        return Response({"message": "Food change approved successfully."}, status=status.HTTP_200_OK)


class RestaurantWithLocationView(generics.CreateAPIView):
    """Create a restaurant with location information in a single request"""
    serializer_class = RestaurantSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateRestaurantLocationView(generics.UpdateAPIView):
    """Update a restaurant's location"""
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial)

        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetRestaurantLocationView(generics.RetrieveAPIView):
    """Get location for a specific restaurant"""
    queryset = Restaurant.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Get the locations for this restaurant
        locations = Location.objects.filter(restaurants=instance)

        if not locations.exists():
            return Response({"detail": "No location data found for this restaurant"}, status=status.HTTP_404_NOT_FOUND)

        # Use the first location (most restaurants will have just one)
        location = locations.first()

        return Response({
            "restaurant_id": instance.id,
            "restaurant_name": instance.name,
            "latitude": location.latitude,
            "longitude": location.longitude
        })


class GetAllRestaurantLocationsView(generics.ListAPIView):
    """Get locations for all restaurants"""

    def list(self, request, *args, **kwargs):
        # Get all restaurants with locations
        restaurants_with_locations = []

        for restaurant in Restaurant.objects.all():
            locations = Location.objects.filter(restaurants=restaurant)
            if locations.exists():
                location = locations.first()
                restaurants_with_locations.append({
                    "restaurant_id": restaurant.id,
                    "restaurant_name": restaurant.name,
                    "latitude": location.latitude,
                    "longitude": location.longitude
                })

        return Response(restaurants_with_locations)


class BatchSaveRestaurantsView(generics.CreateAPIView):
    """Save multiple restaurants with location in a single request"""
    serializer_class = RestaurantSerializer

    def create(self, request, *args, **kwargs):
        restaurants_data = request.data

        if not isinstance(restaurants_data, list):
            return Response({"error": "Expected a list of restaurants"}, status=status.HTTP_400_BAD_REQUEST)

        saved_restaurants = []
        errors = []

        for restaurant_data in restaurants_data:
            try:
                # Extract location data if provided
                latitude = restaurant_data.pop('latitude', None)
                longitude = restaurant_data.pop('longitude', None)

                # First, check if a restaurant with this name already exists
                existing = Restaurant.objects.filter(
                    name=restaurant_data.get('name')).first()

                if existing:
                    # Update existing restaurant
                    for key, value in restaurant_data.items():
                        setattr(existing, key, value)
                    existing.save()
                    restaurant = existing
                else:
                    # Create new restaurant
                    restaurant = Restaurant.objects.create(**restaurant_data)

                # Handle location data if provided
                if latitude is not None and longitude is not None:
                    location, created = Location.objects.get_or_create(
                        latitude=latitude,
                        longitude=longitude
                    )
                    location.restaurants.add(restaurant)

                # Add to saved restaurants
                saved_restaurants.append({
                    "id": restaurant.id,
                    "name": restaurant.name,
                    "foods_on_menu": restaurant
                })
            except Exception as e:
                errors.append(
                    {"restaurant_data": restaurant_data, "error": str(e)})

        if errors:
            return Response({"saved_restaurants": saved_restaurants, "errors": errors}, status=status.HTTP_207_MULTI_STATUS)

        return Response({"saved_restaurants": saved_restaurants}, status=status.HTTP_201_CREATED)


# GENERICS - mainly for testing purposes

# User CRUD
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Restaurant CRUD


class RestaurantListCreateView(generics.ListCreateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer


class RestaurantRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

# # ExactLocation CRUD
# class ExactLocationListCreateView(generics.ListCreateAPIView):
#     queryset = ExactLocation.objects.all()
#     serializer_class = ExactLocationSerializer

# class ExactLocationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = ExactLocation.objects.all()
#     serializer_class = ExactLocationSerializer

# Location CRUD


class LocationListCreateView(generics.ListCreateAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer


class LocationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

# Ingredient CRUD


class IngredientListCreateView(generics.ListCreateAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer


class IngredientRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

# Food CRUD


class FoodListCreateView(generics.ListCreateAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer


class FoodRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer

# FoodChange CRUD


class FoodChangeListCreateView(generics.ListCreateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer


class FoodChangeRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
