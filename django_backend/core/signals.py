from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Food
from .services.restaurant_service import RestaurantService
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Food)
def update_restaurant_hazard_on_food_change(sender, instance, created, **kwargs):
    """
    Signal handler to update restaurant hazard level when a food is created or updated
    """
    # Only update if the food is approved - otherwise wait for approval
    if instance.is_approved:
        logger.info(
            f"Food {instance.name} {'created' if created else 'updated'}, updating restaurant hazard level")
        RestaurantService.update_restaurant_hazard_level(
            instance.restaurant.id)


@receiver(post_delete, sender=Food)
def update_restaurant_hazard_on_food_delete(sender, instance, **kwargs):
    """
    Signal handler to update restaurant hazard level when a food is deleted
    """
    if hasattr(instance, 'restaurant') and instance.restaurant and instance.restaurant.id:
        logger.info(
            f"Food {instance.name} deleted, updating restaurant hazard level")
        RestaurantService.update_restaurant_hazard_level(
            instance.restaurant.id)
