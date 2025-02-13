import random
import string

from .serializers import *
from rest_framework import generics
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.http import urlsafe_base64_decode
from .models import ConfirmationToken, User, Restaurant, Ingredient, Food
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


from rest_framework_simplejwt.views import TokenObtainPairView

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
    queryset = Food.objects.all()
    serializer_class = FoodSerializer