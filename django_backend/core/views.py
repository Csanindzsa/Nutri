import random
import string

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
from django.conf import settings
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

    def perform_create(self, serializer):
        # Set is_approved to False upon creation
        serializer.validated_data['is_approved'] = False

        # Save the Food instance
        food = serializer.save()

        # If the user is a supervisor, add them to the approved_users
        if self.request.user.is_supervisor:
            food.approved_users.add(self.request.user)

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

        # Save the updated food instance
        food.save()

        # Return a success response
        return Response(
            {"detail": "Food item approved successfully."},
            status=status.HTTP_200_OK
        )
    
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
