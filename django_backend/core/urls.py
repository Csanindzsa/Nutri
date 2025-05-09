from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from django.conf import settings
from django.conf.urls.static import static
from .views import *


urlpatterns = [
    # JWT endpoints
    path('token/', CustomTokenObtainPairView.as_view(),
         name='token_obtain_pair'),  # Get Access + Refresh Token
    path('token/refresh/', TokenRefreshView.as_view(),
         name='token_refresh'),  # Refresh Access Token
    path('token/verify/', TokenVerifyView.as_view(),
         name='token_verify'),  # Verify Token
    path('create-user/', CreateUserView.as_view(), name='create_user'),
    path('confirm-email/', ConfirmEmail.as_view(), name='confirm-email'),
    path('users/edit/', EditUserView.as_view(), name='edit-user'),
    path('users/delete/', DeleteUserView.as_view(), name='delete-user'),

    path('restaurants/', RestaurantListView.as_view(), name='restaurants_list'),
    path('locations/', ListViewLocations.as_view(), name='locations_list'),

    path('foods/', FoodListView.as_view(), name='foods_list'),
    path('foods/create/', FoodCreateView.as_view(), name='food_create'),
    path('food/<int:pk>/accept/', AcceptFood.as_view(), name='accept-food'),
    path('foods/approvable/', GetApprovableFoods.as_view(), name='accept-food'),

    path('food-changes/propose-change/',
         CreateFoodChange.as_view(), name='create-food-change'),
    path('food-changes/updates/', FoodChangeUpdateListView.as_view()),
    path('food-changes/<int:pk>/approve-change/', ApproveProposal.as_view(),
         name='create-food-change'),  # same as in approve-removal

    path('food/<int:food_id>/propose-removal/',
         CreateFoodRemoval.as_view(), name='propose-food-removal'),
    path('food-changes/deletions/', FoodChangeDeletionListView.as_view(),
         name='food-change-deletions-list'),
    path('food-changes/<int:pk>/approve-removal/',
         ApproveProposal.as_view(), name='approve-food-change'),

    path('ingredients/', IngredientListView.as_view()),


    # GENERICS - mainly for testing purposes
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserRetrieveUpdateDestroyView.as_view(),
         name='user-retrieve-update-destroy'),

    # Restaurant URLs
    path('restaurants/', RestaurantListCreateView.as_view(),
         name='restaurant-list-create'),
    path('restaurants/<int:pk>/', RestaurantRetrieveUpdateDestroyView.as_view(),
         name='restaurant-retrieve-update-destroy'),

    # Add new restaurant location endpoints
    path('restaurants/with-location/', RestaurantWithLocationView.as_view(),
         name='restaurant-with-location'),
    path('restaurants/<int:pk>/location/',
         UpdateRestaurantLocationView.as_view(), name='update-restaurant-location'),
    path('restaurants/<int:pk>/get-location/',
         GetRestaurantLocationView.as_view(), name='get-restaurant-location'),
    path('restaurants/locations/', GetAllRestaurantLocationsView.as_view(),
         name='get-all-restaurant-locations'),

    # Add the URL pattern for the batch save endpoint
    path('restaurants/batch-save/', BatchSaveRestaurantsView.as_view(),
         name='batch-save-restaurants'),

    # # ExactLocation URLs
    # path('exact-locations/', ExactLocationListCreateView.as_view(), name='exact-location-list-create'),
    # path('exact-locations/<int:pk>/', ExactLocationRetrieveUpdateDestroyView.as_view(), name='exact-location-retrieve-update-destroy'),

    # Location URLs
    path('locations/', LocationListCreateView.as_view(),
         name='location-list-create'),
    path('locations/<int:pk>/', LocationRetrieveUpdateDestroyView.as_view(),
         name='location-retrieve-update-destroy'),

    # Ingredient URLs
    path('ingredients/', IngredientListCreateView.as_view(),
         name='ingredient-list-create'),
    path('ingredients/<int:pk>/', IngredientRetrieveUpdateDestroyView.as_view(),
         name='ingredient-retrieve-update-destroy'),

    # Food URLs
    path('foods/', FoodListCreateView.as_view(), name='food-list-create'),
    path('foods/<int:pk>/', FoodRetrieveUpdateDestroyView.as_view(),
         name='food-retrieve-update-destroy'),

    # FoodChange URLs
    path('food-changes/', FoodChangeListCreateView.as_view(),
         name='food-change-list-create'),
    path('food-changes/<int:pk>/', FoodChangeRetrieveUpdateDestroyView.as_view(),
         name='food-change-retrieve-update-destroy'),

     #support ticket creation
     path('ticket/', SupportMessageCreateView.as_view(), name="support-message-create-view"),
     
]


urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
