import random
import string

from django.db import IntegrityError
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist

from .serializers import *
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)
import dotenv
import os

dotenv.load_dotenv()
# from .tokens import email_confirmation_token
# Create your views here.
class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    
    def generate_token(self, length=32):
        """Generate a random 32-character token."""
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(length))
    
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
            message = f'Click here to confirm your email: http://localhost:5173/confirm-email/{confirmation_token.code}'
            from_email = os.getenv("EMAIL")  # Use the email from your settings
            recipient_list = [user.email]  # The recipient's email address
            
            send_mail(subject, message, from_email, recipient_list)

            return Response({
                "message": "User created successfully, a confirmation token has been generated."
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


class ConfirmEmail(generics.CreateAPIView):
    def post(self, request, *args, **kwargs):
        # Step 1: Extract token from the request (can be in the body or query parameters)
        token = request.data.get("token")  # Assuming the token is sent in the body
        
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

class RestaurantListView(generics.ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer

class ListViewExactLocations(generics.ListAPIView):
    queryset = ExactLocation.objects.all()
    serializer_class = ExactLocationSerializer

class IngredientListView(generics.ListAPIView):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

class FoodListView(generics.ListAPIView):
    queryset = Food.objects.filter(is_approved=True)
    serializer_class = FoodSerializer

class FoodCreateView(generics.CreateAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except ValidationError as e:
            logger.error(f"Validation error: {e.detail}")
            return Response({"error": "Validation failed", "details": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Unexpected error during food creation: {str(e)}")
            return Response({"error": "An unexpected error occurred", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        if self.request.user.is_supervisor:
            serializer.validated_data['approved_supervisors_count'] = 1
        if self.request.user.is_staff:
            serializer.validated_data['approved_supervisors_count'] = 5
        if self.request.user.is_admin:
            serializer.validated_data['is_approved'] = True
            serializer.validated_data['approved_supervisors_count'] = 10
        else:
            serializer.validated_data['is_approved'] = False

        food = serializer.save()
        if self.request.user.is_supervisor:
            food.approved_supervisors.add(self.request.user)
        food.save()


class GetApprovableFoods(generics.ListAPIView):
    queryset = Food.objects.filter(is_approved=False).select_related('restaurant')  # Optimize query
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        for i, food in enumerate(queryset):
            data[i]['approved_supervisors_count'] = food.approved_supervisors.filter(is_supervisor=True).count()
            data[i]['restaurant_name'] = food.restaurant.name  # Add restaurant name
            data[i]['approved_supervisors'] = list(food.approved_supervisors.filter(is_supervisor=True).values('id', 'username'))  # Add approved supervisors list

        return Response(data)



class AcceptFood(generics.UpdateAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        food = self.get_object()
        if not request.user.is_supervisor:
            return Response({"detail": "Only supervisors can approve food items."}, status=status.HTTP_403_FORBIDDEN)

        if food.approved_supervisors.filter(id=request.user.id).exists():
            return Response({"detail": "You have already approved this food item."}, status=status.HTTP_403_FORBIDDEN)

        food.approved_supervisors.add(request.user)
        food.save()

        # Calculate the total approval weight
        total_approval_weight = 0
        for supervisor in food.approved_supervisors.all():
            if supervisor.is_staff:
                total_approval_weight += 5  # Staff approval is worth 5x
            elif supervisor.is_supervisor:
                total_approval_weight += 1  # Supervisor approval is worth 1x
            elif supervisor.is_admin:
                total_approval_weight += 10

        # Define the threshold for approval
        REQUIRED_APPROVALS = 10  # Example: require 10 approval points

        # If the threshold is met, mark the food as approved
        if total_approval_weight >= REQUIRED_APPROVALS:
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

import json
def parse_json(value):
    """Ensure the value is properly stored as JSON, not a string."""
    if isinstance(value, dict):  
        return value  # Already a JSON object
    if isinstance(value, str):
        try:
            return json.loads(value)  # Convert JSON string to actual JSON object
        except json.JSONDecodeError:
            return {}  # Return empty JSON if invalid
    return {}  # Default to empty JSON if value is not vali

class CreateFoodChange(generics.CreateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            food_id = request.data.get("food_id")
            if not food_id:
                logger.error("food_id is required.")
                return Response({"error": "food_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            food = Food.objects.get(id=food_id)
            new_data = request.data
            logger.debug("new data: %s", new_data)

            ingredients = new_data.get("ingredients", "[]")
            try:
                ingredient_ids = json.loads(ingredients)
                if not isinstance(ingredient_ids, list):
                    return Response({"error": "ingredients must be a JSON-encoded array."}, status=status.HTTP_400_BAD_REQUEST)
            except json.JSONDecodeError:
                return Response({"error": "ingredients must be a valid JSON-encoded array."}, status=status.HTTP_400_BAD_REQUEST)

            valid_ingredient_ids = []
            invalid_ingredient_ids = []
            for ing_id in ingredient_ids:
                try:
                    ing_id = int(ing_id)
                    Ingredient.objects.get(id=ing_id)
                    valid_ingredient_ids.append(ing_id)
                except (ValueError, TypeError, ObjectDoesNotExist):
                    invalid_ingredient_ids.append(ing_id)

            if invalid_ingredient_ids:
                return Response({"error": f"Ingredients with IDs {', '.join(map(str, invalid_ingredient_ids))} are invalid or do not exist."}, status=status.HTTP_400_BAD_REQUEST)

            food_change = FoodChange.objects.create(
                old_version=food,
                is_deletion=convert_value(new_data.get("is_deletion", False), bool),
                new_restaurant=food.restaurant,
                new_name=new_data.get("name", food.name),
                new_serving_size=convert_value(new_data.get("serving_size", food.serving_size), float),
                new_macro_table=parse_json(new_data.get("macro_table", food.macro_table)),
                new_is_organic=convert_value(new_data.get("is_organic", food.is_organic), bool),
                new_is_gluten_free=convert_value(new_data.get("is_gluten_free", food.is_gluten_free), bool),
                new_is_alcohol_free=convert_value(new_data.get("is_alcohol_free", food.is_alcohol_free), bool),
                new_is_lactose_free=convert_value(new_data.get("is_lactose_free", food.is_lactose_free), bool),
                new_image=new_data.get("image", food.image),
                new_is_approved=False,
            )

            if valid_ingredient_ids:
                food_change.new_ingredients.set(valid_ingredient_ids)

            if request.user.is_supervisor:
                food_change.new_approved_supervisors.add(request.user)
                food_change.new_approved_supervisors_count = 1
                if request.user.is_staff:
                    food_change.new_approved_supervisors_count = 5
                    if request.user.is_admin:
                        food_change.new_approved_supervisors_count = 10
            
            food_change.save()
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
            existing_proposal = FoodChange.objects.filter(old_version=food, is_deletion=True).first()
            if existing_proposal:
                raise IntegrityError("A removal proposal is already active for this food item.")

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
                food_change.new_approved_supervisors_count = 1
                if request.user.is_staff:
                    food_change.new_approved_supervisors_count = 5
                    if request.user.is_admin:
                        food_change.new_approved_supervisors_count = 10

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
        food_change = get_object_or_404(FoodChange, id=kwargs.get('pk'))
        if not request.user.is_supervisor:
            return Response({"error": "Only supervisors can approve food changes."}, status=status.HTTP_403_FORBIDDEN)

        food_change.new_approved_supervisors.add(request.user)

        # Calculate the total approval weight
        total_approval_weight = 0
        for supervisor in food_change.new_approved_supervisors.all():
            if supervisor.is_staff:
                total_approval_weight += 5  # Staff approval is worth 5x
            elif supervisor.is_supervisor:
                total_approval_weight += 1  # Supervisor approval is worth 1x
            elif supervisor.admin:
                total_approval_weight += 10

        # Check if the FoodChange has enough approvals to be marked as approved
        required_approvals = 15  # Example: require 20 approval points
        if total_approval_weight >= required_approvals:
            # Mark the FoodChange as approved
            food_change.new_is_approved = True
            food_change.new_approved_supervisors_count = total_approval_weight
            food_change.save()

            if food_change.old_version:
                try:
                    original_food = Food.objects.get(id=food_change.old_version.id)
                    original_food.delete()
                except Food.DoesNotExist:
                    return Response({"error": "The original Food object does not even exist."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"message": "Food change approved successfully."}, status=status.HTTP_200_OK)


### GENERICS - mainly for testing purposes

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

# ExactLocation CRUD
class ExactLocationListCreateView(generics.ListCreateAPIView):
    queryset = ExactLocation.objects.all()
    serializer_class = ExactLocationSerializer

class ExactLocationRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExactLocation.objects.all()
    serializer_class = ExactLocationSerializer

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
