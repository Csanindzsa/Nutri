from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Food, FoodChange
from .services.restaurant_service import RestaurantService
import logging
import traceback
from django.db import transaction

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


@receiver(post_save, sender=FoodChange)
def apply_food_change_on_approval(sender, instance, **kwargs):
    """
    Signal handler to apply food changes when a FoodChange is marked as approved
    This ensures changes are applied regardless of how the approval happens (API or Admin)
    """
    try:
        # Only proceed if this FoodChange is newly approved (new_is_approved has been set to True)
        if not instance.new_is_approved:
            return

        logger.info(
            f"FoodChange #{instance.id} ({instance.new_name}) has been approved, applying changes")

        with transaction.atomic():
            # Process the original Food object if it exists
            if instance.old_version:
                try:
                    food = instance.old_version
                    logger.info(
                        f"Found original food #{food.id} ({food.name})")

                    if not instance.is_deletion:
                        # Update the food with new values
                        logger.info(f"Applying changes to food #{food.id}")

                        # Track all changes for debugging
                        changes = []

                        if food.name != instance.new_name:
                            changes.append(
                                f"name: '{food.name}' → '{instance.new_name}'")
                            food.name = instance.new_name

                        if food.restaurant.id != instance.new_restaurant.id:
                            changes.append(
                                f"restaurant: {food.restaurant.name} → {instance.new_restaurant.name}")
                            food.restaurant = instance.new_restaurant

                        # Update all other fields
                        food.macro_table = instance.new_macro_table
                        food.serving_size = instance.new_serving_size
                        food.is_organic = instance.new_is_organic
                        food.is_gluten_free = instance.new_is_gluten_free
                        food.is_alcohol_free = instance.new_is_alcohol_free
                        food.is_lactose_free = instance.new_is_lactose_free

                        if instance.new_image:
                            food.image = instance.new_image

                        # Update ingredients
                        old_ingredients = set(
                            food.ingredients.values_list('id', flat=True))
                        new_ingredients = set(
                            instance.new_ingredients.values_list('id', flat=True))

                        if old_ingredients != new_ingredients:
                            changes.append(
                                f"ingredients changed: {old_ingredients} → {new_ingredients}")
                            food.ingredients.set(
                                instance.new_ingredients.all())

                        # Log all the changes
                        if changes:
                            logger.info(
                                f"Applied changes to food #{food.id}: {', '.join(changes)}")
                        else:
                            logger.info(
                                f"No changes to apply to food #{food.id}")

                        # Calculate new hazard level based on ingredients
                        old_hazard = food.hazard_level
                        food.calculate_hazard_level()
                        logger.info(
                            f"Updated hazard level: {old_hazard} → {food.hazard_level}")

                        # Save the updated food
                        food.save()
                        logger.info(
                            f"Successfully saved updated food #{food.id}")

                        # Update restaurant hazard level
                        RestaurantService.update_restaurant_hazard_level(
                            food.restaurant.id)
                        logger.info(
                            f"Restaurant #{food.restaurant.id} hazard level updated")

                    else:
                        # Delete the original Food object
                        logger.info(f"Deleting food #{food.id} ({food.name})")
                        restaurant_id = food.restaurant.id
                        food.delete()
                        logger.info(
                            f"Food #{instance.old_version.id} deleted successfully")

                        # Update restaurant hazard level after deletion
                        RestaurantService.update_restaurant_hazard_level(
                            restaurant_id)
                        logger.info(
                            f"Restaurant #{restaurant_id} hazard level updated after deletion")

                except Exception as e:
                    logger.error(
                        f"Error applying food change #{instance.id} to food: {e}")
                    logger.error(traceback.format_exc())

    except Exception as e:
        logger.error(f"Error in apply_food_change_on_approval signal: {e}")
        logger.error(traceback.format_exc())
