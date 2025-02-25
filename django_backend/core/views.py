import random
import string

from django.db import IntegrityError
from django.db.models import Count

from .serializers import *
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView
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
            # Log the incoming request data for debugging
            logger.debug(f"Incoming request data: {request.data}")

            # Perform the default create logic
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)

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
    
class CreateFoodChange(generics.CreateAPIView):
    queryset = FoodChange.objects.all()
    serializer_class = FoodChangeSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        food_id = request.data.get("food_id")
        new_data = request.data

        food = get_object_or_404(Food, id=food_id)

        food_change = FoodChange.objects.create(
            old_version=food,
            is_deletion=new_data.get("is_deletion", False),
            new_restaurant=food.restaurant,  # Keep the restaurant the same
            new_name=new_data.get("new_name", food.name),
            new_serving_size = new_data.get("new_serving_size", food.serving_size),
            new_macro_table=new_data.get("new_macro_table", food.macro_table),
            new_calories=new_data.get("new_calories", food.calories),
            new_is_organic=new_data.get("new_is_organic", food.is_organic),
            new_is_gluten_free=new_data.get("new_is_gluten_free", food.is_gluten_free),
            new_is_alcohol_free=new_data.get("new_is_alcohol_free", food.is_alcohol_free),
            new_is_lactose_free=new_data.get("new_is_lactose_free", food.is_lactose_free),
            new_image=new_data.get("new_image", food.image),
            new_is_approved=False,
        )

        if "new_ingredients" in new_data:
            food_change.new_ingredients.set(new_data["new_ingredients"])

        return Response({"message": "Food change request created successfully."}, status=status.HTTP_201_CREATED)

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
                new_calories=food.calories,
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

class ApproveFoodRemoval(generics.UpdateAPIView):
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
        required_approvals = 20  # Example: require 5 supervisor approvals
        if food_change.new_approved_supervisors.count() >= required_approvals:
            # Mark the FoodChange as approved
            food_change.new_is_approved = True
            food_change.save()

            # Retrieve and delete the original Food object (if old_version is not null)
            if food_change.old_version:
                try:
                    original_food = Food.objects.get(id=food_change.old_version.id)
                    original_food.delete()  # Delete the original Food object
                except Food.DoesNotExist:
                    # Handle the case where the original Food object no longer exists
                    return Response(
                        {"error": "The original Food object does not even exist."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

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
