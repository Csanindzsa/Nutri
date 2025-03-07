import logging
from typing import List, Dict, Any, Optional
from django.db import transaction, IntegrityError, DatabaseError
from django.db.models import Avg, Count
from ..models import Restaurant, Location

logger = logging.getLogger(__name__)


class RestaurantService:
    """
    Service class for handling restaurant-related operations including batch saving
    """

    @classmethod
    def batch_save_restaurants(cls, restaurants_data: List[Dict[Any, Any]]) -> Dict[str, Any]:
        """
        Save multiple restaurants with their coordinates

        Args:
            restaurants_data: List of dictionaries containing restaurant data

        Returns:
            Dict with statistics about the operation
        """
        if not restaurants_data:
            return {"saved": 0, "updated": 0, "errors": 0}

        stats = {"saved": 0, "updated": 0, "errors": 0}
        saved_restaurants = []

        # Process each restaurant in its own transaction
        for restaurant_data in restaurants_data:
            try:
                with transaction.atomic():
                    # Extract location data
                    latitude = restaurant_data.pop('latitude', None)
                    longitude = restaurant_data.pop('longitude', None)

                    # Ensure we have a restaurant name
                    restaurant_name = restaurant_data.get('name')
                    if not restaurant_name:
                        logger.warning(
                            f"Skipping restaurant without name: {restaurant_data}")
                        stats["errors"] += 1
                        continue

                    # First check if a location with these coordinates already exists
                    if latitude is not None and longitude is not None:
                        # Round coordinates for a better match
                        rounded_lat = round(float(latitude), 6)
                        rounded_lng = round(float(longitude), 6)

                        # Find existing location within a small radius
                        # This helps handle slight variations in coordinates for the same physical location
                        existing_location = Location.objects.filter(
                            latitude__range=(
                                rounded_lat - 0.0001, rounded_lat + 0.0001),
                            longitude__range=(
                                rounded_lng - 0.0001, rounded_lng + 0.0001)
                        ).first()

                        if existing_location and existing_location.restaurant:
                            # We found an existing location with a restaurant already assigned
                            # Update the existing restaurant with any new data
                            restaurant = existing_location.restaurant

                            # Update fields if needed
                            fields_updated = []
                            for key, value in restaurant_data.items():
                                if key != 'name' and hasattr(restaurant, key) and value is not None:
                                    old_value = getattr(restaurant, key)
                                    setattr(restaurant, key, value)
                                    if old_value != value:
                                        fields_updated.append(key)

                            if fields_updated:
                                restaurant.save()
                                logger.info(
                                    f"Updated existing restaurant at location: {restaurant.name}")
                                stats["updated"] += 1
                            else:
                                logger.info(
                                    f"Found existing restaurant at location: {restaurant.name}")
                                # Count as update even if no fields changed
                                stats["updated"] += 1

                            saved_restaurants.append({
                                "id": restaurant.id,
                                "name": restaurant.name,
                                "matched_location": True
                            })
                            continue  # Skip to next restaurant since we found a match

                    # If we get here, either no location exists or no restaurant is associated
                    # Proceed with normal restaurant creation/update
                    restaurant = cls._get_or_create_restaurant(restaurant_data)
                    if restaurant:
                        # Save location if coordinates are available
                        if latitude is not None and longitude is not None:
                            cls._add_location_to_restaurant(
                                restaurant, latitude, longitude)

                        saved_restaurants.append({
                            "id": restaurant.id,
                            "name": restaurant.name,
                            "matched_location": False
                        })

                        if restaurant_data.get('_is_new', False):
                            stats["saved"] += 1
                            logger.info(
                                f"Created new restaurant: {restaurant.name}")
                        else:
                            stats["updated"] += 1
                            logger.info(
                                f"Updated existing restaurant: {restaurant.name}")
                    else:
                        stats["errors"] += 1

            except (IntegrityError, DatabaseError) as db_error:
                stats["errors"] += 1
                logger.error(
                    f"Database error processing restaurant '{restaurant_data.get('name', 'unknown')}': {db_error}")
            except Exception as e:
                stats["errors"] += 1
                logger.error(
                    f"Error processing restaurant {restaurant_data.get('name', 'unknown')}: {str(e)}")

        # Log the final stats
        logger.info(
            f"Batch save summary: Created {stats['saved']}, Updated {stats['updated']}, Errors {stats['errors']}")

        # Force a database commit to ensure all changes are persisted
        try:
            transaction.commit()
        except Exception:
            # This will only happen if we're not in a transaction
            pass

        return {
            **stats,
            "saved_restaurants": saved_restaurants
        }

    @staticmethod
    def _get_or_create_restaurant(restaurant_data: Dict[str, Any]) -> Optional[Restaurant]:
        """Get an existing restaurant or create a new one"""
        restaurant_name = restaurant_data.get('name')

        if not restaurant_name:
            logger.error("Cannot create restaurant without a name")
            return None

        try:
            # Try to get existing restaurant - use case-insensitive matching
            restaurant = Restaurant.objects.filter(
                name__iexact=restaurant_name).first()

            if restaurant:
                logger.info(
                    f"Found existing restaurant: {restaurant_name} (ID: {restaurant.id})")
                # Update existing restaurant fields if provided
                # Only update fields that have been provided in the request
                fields_updated = []
                for key, value in restaurant_data.items():
                    if key != 'name' and hasattr(restaurant, key) and value is not None:
                        old_value = getattr(restaurant, key)
                        setattr(restaurant, key, value)
                        if old_value != value:
                            fields_updated.append(key)

                if fields_updated:
                    restaurant.save()
                    logger.info(
                        f"Updated fields for '{restaurant_name}': {', '.join(fields_updated)}")
                else:
                    logger.info(
                        f"No fields updated for existing restaurant: {restaurant_name}")

                restaurant_data['_is_new'] = False
                restaurant_data['_fields_updated'] = fields_updated
                return restaurant
            else:
                # Create new restaurant with only valid fields for the Restaurant model
                restaurant_data_clean = {
                    'name': restaurant_name,
                    'cuisine': restaurant_data.get('cuisine', 'Unknown'),
                    'description': restaurant_data.get('description', ''),
                    # Add any other valid fields from the Restaurant model
                    'foods_on_menu': restaurant_data.get('foods_on_menu', 0),
                }

                # Only add image if it exists in the data
                if 'image' in restaurant_data and restaurant_data['image']:
                    restaurant_data_clean['image'] = restaurant_data['image']

                # Double-check for existing restaurant again with exact match to prevent unique constraint errors
                existing = Restaurant.objects.filter(
                    name=restaurant_name).first()
                if existing:
                    # We found an exact match, use that instead of creating a new one
                    logger.info(
                        f"Found exact case match for restaurant: {restaurant_name}")
                    restaurant_data['_is_new'] = False
                    return existing

                # Create the restaurant with clean data
                restaurant = Restaurant.objects.create(**restaurant_data_clean)
                restaurant_data['_is_new'] = True
                logger.info(f"Created restaurant: {restaurant_name}")
                return restaurant

        except IntegrityError as e:
            # Handle unique constraint violation more specifically
            logger.error(
                f"Integrity error for restaurant {restaurant_name}: {str(e)}")
            # Try to return the existing restaurant anyway
            existing = Restaurant.objects.filter(name=restaurant_name).first()
            if existing:
                restaurant_data['_is_new'] = False
                return existing
            raise
        except Exception as e:
            logger.error(
                f"Error getting/creating restaurant {restaurant_name}: {str(e)}")
            # Re-raise to handle in the calling function's transaction
            raise

    @staticmethod
    def _add_location_to_restaurant(restaurant: Restaurant, latitude: float, longitude: float) -> None:
        """Add location coordinates to a restaurant"""
        try:
            # Round coordinates to 6 decimal places (approximately 10cm precision)
            latitude = round(latitude, 6)
            longitude = round(longitude, 6)

            # Check if this exact location already exists for this restaurant
            existing_location = Location.objects.filter(
                restaurant=restaurant,
                latitude=latitude,
                longitude=longitude
            ).first()

            if existing_location:
                logger.info(
                    f"Location ({latitude}, {longitude}) already exists for restaurant {restaurant.name}")
                return existing_location

            # Create a new location entry for this restaurant
            # The restaurant ForeignKey is set directly during creation
            location = Location.objects.create(
                restaurant=restaurant,  # This sets the restaurant_id automatically
                latitude=latitude,
                longitude=longitude
            )
            logger.info(
                f"Added new location ({latitude}, {longitude}) to restaurant {restaurant.name}")
            return location
        except Exception as e:
            logger.error(
                f"Error adding location to restaurant {restaurant.name}: {str(e)}")
            # Re-raise to handle in the calling function's transaction
            raise

    @staticmethod
    def find_closest_location(restaurant_id: int, user_lat: float, user_lng: float) -> Optional[Dict]:
        """
        Finds the closest location for a given restaurant to the user's coordinates
        """
        try:
            # Get all locations for this restaurant (now directly through the foreign key)
            locations = Location.objects.filter(restaurant_id=restaurant_id)

            if not locations.exists():
                logger.warning(
                    f"No locations found for restaurant ID: {restaurant_id}")
                return None

            # Use Haversine formula to find closest location
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        l.id,
                        l.latitude,
                        l.longitude,
                        (6371 * acos(cos(radians(%s)) * cos(radians(l.latitude)) *
                        cos(radians(l.longitude) - radians(%s)) +
                        sin(radians(%s)) * sin(radians(l.latitude)))) AS distance
                    FROM
                        Locations l
                    WHERE
                        l.restaurant_id = %s
                    ORDER BY
                        distance ASC
                    LIMIT 1
                """, [user_lat, user_lng, user_lat, restaurant_id])

                result = cursor.fetchone()

            if result:
                location_id, lat, lng, distance = result
                return {
                    'id': location_id,
                    'latitude': lat,
                    'longitude': lng,
                    'distance': distance,  # in kilometers
                    'restaurant_id': restaurant_id
                }

            return None

        except Exception as e:
            logger.error(f"Error finding closest location: {str(e)}")
            return None

    @staticmethod
    def update_restaurant_hazard_level(restaurant_id):
        """
        Calculate and update the hazard level for a restaurant based on all its foods
        """
        # Import here to avoid circular imports
        from core.models import Restaurant, Food

        try:
            with transaction.atomic():
                restaurant = Restaurant.objects.get(id=restaurant_id)

                # Get all approved foods for this restaurant
                foods = Food.objects.filter(
                    restaurant=restaurant, is_approved=True)

                if foods.exists():
                    # Calculate the average hazard level across all foods
                    avg_hazard = foods.aggregate(
                        avg=Avg('hazard_level'))['avg'] or 0

                    # Round to 1 decimal place for consistency
                    restaurant.hazard_level = round(avg_hazard, 1)
                    restaurant.save(update_fields=['hazard_level'])

                    logger.info(
                        f"Updated restaurant {restaurant.name} hazard level to {restaurant.hazard_level}")
                else:
                    # If no foods, set hazard level to 0
                    restaurant.hazard_level = 0
                    restaurant.save(update_fields=['hazard_level'])

                    logger.info(
                        f"Restaurant {restaurant.name} has no foods, hazard level set to 0")

                return restaurant.hazard_level

        except Restaurant.DoesNotExist:
            logger.error(f"Restaurant with ID {restaurant_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error updating restaurant hazard level: {str(e)}")
            return None

    @staticmethod
    def process_pending_food_changes():
        """
        Process any pending food changes that might have reached the approval threshold
        but weren't processed due to race conditions or other issues
        """
        from ..models import FoodChange, Food

        logger.info(
            "Checking for pending food changes that meet approval criteria...")
        required_approvals = 2  # Should match the value in ApproveProposal view

        # Get approved but not processed food changes
        pending_changes = FoodChange.objects.annotate(
            approval_count=Count('new_approved_supervisors')
        ).filter(
            new_is_approved=False,
            approval_count__gte=required_approvals
        )

        processed_count = 0

        for change in pending_changes:
            try:
                # Mark as approved
                change.new_is_approved = True
                change.save()
                logger.info(f"Marked pending change #{change.id} as approved")

                # Check if the food still exists
                if change.old_version:
                    try:
                        food = Food.objects.get(id=change.old_version.id)

                        # Apply the changes or delete as appropriate
                        if change.is_deletion:
                            restaurant_id = food.restaurant.id
                            food.delete()
                            logger.info(
                                f"Deleted food #{food.id} from pending change")
                            RestaurantService.update_restaurant_hazard_level(
                                restaurant_id)
                        else:
                            # Apply all the updates
                            # (Similar code to ApproveProposal but simplified)
                            food.name = change.new_name
                            food.restaurant = change.new_restaurant
                            food.macro_table = change.new_macro_table
                            food.serving_size = change.new_serving_size
                            food.is_organic = change.new_is_organic
                            food.is_gluten_free = change.new_is_gluten_free
                            food.is_alcohol_free = change.new_is_alcohol_free
                            food.is_lactose_free = change.new_is_lactose_free

                            if change.new_image:
                                food.image = change.new_image

                            food.ingredients.set(change.new_ingredients.all())
                            food.calculate_hazard_level()
                            food.save()

                            logger.info(
                                f"Applied pending change #{change.id} to food #{food.id}")
                            RestaurantService.update_restaurant_hazard_level(
                                food.restaurant.id)
                    except Food.DoesNotExist:
                        logger.error(
                            f"Food #{change.old_version.id} for pending change #{change.id} not found")

                processed_count += 1

            except Exception as e:
                logger.error(
                    f"Error processing pending change #{change.id}: {e}")

        logger.info(f"Processed {processed_count} pending food changes")
        return processed_count
