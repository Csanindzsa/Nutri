from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from .views import *

urlpatterns = [
    # JWT endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Get Access + Refresh Token
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refresh Access Token
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),  # Verify Token
    path('create-user/', CreateUserView.as_view(), name='create_user'),
    path('confirm-email/', ConfirmEmail.as_view(), name='confirm-email'),

    path('restaurants/', RestaurantListView.as_view(), name='restaurants_list'),
    path('locations/', ListViewExactLocations.as_view(), name='locations_list'),
    path('foods/', FoodListView.as_view(), name='foods_list'),
    # path('ingredients/', IngredientListView.as_view()),
]