import logging
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from .models import (
    User, Restaurant, Location, Ingredient,
    Food, FoodChange, ConfirmationToken
)
from .services.restaurant_service import RestaurantService

logger = logging.getLogger(__name__)

# Define admin actions


def approve_foods(modeladmin, request, queryset):
    """
    Custom admin action to mass approve food items
    """
    # Count already approved items to exclude them
    already_approved = queryset.filter(is_approved=True).count()

    # Update all selected items to approved status
    updated_count = queryset.filter(is_approved=False).update(is_approved=True)

    # Update affected restaurants' hazard levels
    restaurant_ids = set(queryset.values_list('restaurant_id', flat=True))
    for restaurant_id in restaurant_ids:
        RestaurantService.update_restaurant_hazard_level(restaurant_id)

    if already_approved > 0:
        messages.warning(
            request,
            f'{already_approved} foods were already approved and were not modified.'
        )

    if updated_count > 0:
        messages.success(
            request,
            f'{updated_count} foods were successfully approved. Hazard levels were recalculated.'
        )
    else:
        if not already_approved:
            messages.info(request, 'No foods were approved.')


approve_foods.short_description = "Approve selected foods"

# User admin


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_active',
                    'is_supervisor', 'is_staff')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_supervisor', 'is_staff')

# Restaurant admin


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'cuisine', 'foods_on_menu', 'hazard_level')
    search_fields = ('name', 'cuisine')
    list_filter = ('cuisine',)

# Location admin


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('restaurant', 'latitude', 'longitude')
    search_fields = ('restaurant__name',)

# Ingredient admin


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'hazard_level')
    search_fields = ('name',)
    list_filter = ('hazard_level',)

# Food admin with mass approval action


@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'is_approved',
                    'hazard_level', 'created_by')
    search_fields = ('name', 'restaurant__name')
    list_filter = ('is_approved', 'hazard_level', 'restaurant')
    actions = [approve_foods]  # Add our custom action
    filter_horizontal = ('ingredients', 'approved_supervisors')
    readonly_fields = ('hazard_level',)

# FoodChange admin


@admin.register(FoodChange)
class FoodChangeAdmin(admin.ModelAdmin):
    list_display = ('old_version', 'new_name', 'is_deletion',
                    'new_is_approved', 'updated_by')
    search_fields = ('new_name', 'old_version__name')
    list_filter = ('is_deletion', 'new_is_approved')
    filter_horizontal = ('new_ingredients', 'new_approved_supervisors')

# ConfirmationToken admin


@admin.register(ConfirmationToken)
class ConfirmationTokenAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'code')  # Removed 'created_at'
    search_fields = ('user_id__username', 'user_id__email')
