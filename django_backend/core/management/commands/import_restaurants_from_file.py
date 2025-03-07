import json
import os
import logging
from django.core.management.base import BaseCommand
from django.db import transaction, IntegrityError
from core.models import Restaurant, Location
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Import restaurants from a JSON file and add them to the database'

    def add_arguments(self, parser):
        parser.add_argument(
            'file',
            type=str,
            help='Path to the JSON file with restaurant data',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Validate the file without making changes',
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options.get('dry_run', False)

        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
            return

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                restaurants_data = json.load(f)

            if dry_run:
                self.stdout.write(
                    f'Found {len(restaurants_data)} restaurants in file (dry run)')
                self.validate_restaurants(restaurants_data)
                return

            self.import_restaurants(restaurants_data)

        except json.JSONDecodeError:
            self.stderr.write(self.style.ERROR(
                f'Invalid JSON in file: {file_path}'))
        except Exception as e:
            self.stderr.write(self.style.ERROR(
                f'Error importing restaurants: {str(e)}'))

    def validate_restaurants(self, restaurants_data):
        """Validate restaurant data without saving to the database"""
        valid_count = 0
        invalid_count = 0

        for i, restaurant in enumerate(restaurants_data):
            # Check required fields
            if 'name' not in restaurant:
                self.stdout.write(self.style.WARNING(
                    f'Restaurant {i+1} missing name'))
                invalid_count += 1
                continue

            # Check if this restaurant would cause unique constraint issue
            exists = Restaurant.objects.filter(
                name=restaurant['name']).exists()
            if exists:
                self.stdout.write(
                    f'Restaurant with name "{restaurant["name"]}" already exists (would be updated)')
            else:
                self.stdout.write(
                    f'Restaurant "{restaurant["name"]}" is new (would be created)')

            valid_count += 1

        self.stdout.write(self.style.SUCCESS(
            f'Validation complete: {valid_count} valid, {invalid_count} invalid'))

    def import_restaurants(self, restaurants_data):
        """Import restaurants to the database, handling existing restaurants properly"""
        created = 0
        updated = 0
        errors = 0
        skipped = 0

        # First normalize all restaurant names in the data
        for restaurant_data in restaurants_data:
            if 'name' in restaurant_data:
                restaurant_data['name'] = restaurant_data['name'].strip()

        # Now process each restaurant
        for restaurant_data in restaurants_data:
            try:
                with transaction.atomic():
                    # Extract location data if present
                    latitude = restaurant_data.pop('latitude', None)
                    longitude = restaurant_data.pop('longitude', None)

                    # Check if restaurant exists
                    name = restaurant_data.get('name')
                    if not name:
                        self.stdout.write(self.style.WARNING(
                            f'Skipping restaurant without name'))
                        errors += 1
                        continue

                    # Use a more robust lookup method that handles case sensitivity
                    # and does a direct database check for uniqueness
                    try:
                        # First try a case-insensitive lookup
                        existing_restaurant = Restaurant.objects.filter(
                            name__iexact=name).first()

                        if existing_restaurant:
                            # Update the existing restaurant
                            self.update_existing_restaurant(
                                existing_restaurant, restaurant_data)

                            # Add location if coordinates provided
                            if latitude is not None and longitude is not None:
                                self.add_location(
                                    existing_restaurant, latitude, longitude)

                            updated += 1
                            self.stdout.write(self.style.SUCCESS(
                                f'Updated existing restaurant: {existing_restaurant.name}'))
                        else:
                            # Create a new restaurant
                            new_restaurant = self.create_new_restaurant(
                                restaurant_data)

                            # Add location if coordinates provided
                            if latitude is not None and longitude is not None:
                                self.add_location(
                                    new_restaurant, latitude, longitude)

                            created += 1
                            self.stdout.write(self.style.SUCCESS(
                                f'Created new restaurant: {new_restaurant.name}'))

                    except IntegrityError as e:
                        # Handle uniqueness constraint violation
                        if "UNIQUE constraint failed: Restaurants.name" in str(e):
                            self.stdout.write(self.style.WARNING(
                                f'Restaurant "{name}" caused a uniqueness conflict. Skipping.'))
                            skipped += 1
                        else:
                            raise

            except Exception as e:
                errors += 1
                self.stderr.write(self.style.ERROR(
                    f'Error processing restaurant "{restaurant_data.get("name", "unknown")}": {str(e)}'))

        self.stdout.write(self.style.SUCCESS(
            f'Import complete: Created {created}, Updated {updated}, Skipped {skipped}, Errors {errors}'))

    def update_existing_restaurant(self, restaurant, data):
        """Update an existing restaurant with new data"""
        fields_updated = []

        # Update only fields that have values in the data
        for key, value in data.items():
            if key == 'name':  # Skip name updates to avoid unique constraint issues
                continue

            # Handle image fields
            if key in ['image_url', 'image_name'] and value:
                self.process_image_field(restaurant, key, value)
                fields_updated.append('image')
                continue

            if hasattr(restaurant, key) and value is not None:
                old_value = getattr(restaurant, key)
                if old_value != value:
                    setattr(restaurant, key, value)
                    fields_updated.append(key)

        if fields_updated:
            restaurant.save()
            self.stdout.write(
                f"  - Updated fields: {', '.join(fields_updated)}")
        else:
            self.stdout.write("  - No fields needed updating")

        return restaurant

    def process_image_field(self, restaurant, field_type, value):
        """Process image URL or name and update restaurant accordingly"""
        from django.conf import settings

        try:
            if field_type == 'image_url':
                # If it's a full URL to our media
                if value and value.startswith(settings.MEDIA_URL):
                    # Extract relative path
                    relative_path = value[len(settings.MEDIA_URL):]
                    self.stdout.write(
                        f"  - Setting image from URL: {value} -> {relative_path}")
                    restaurant.image = relative_path
                else:
                    self.stdout.write(
                        f"  - External image URL, can't process: {value}")

            elif field_type == 'image_name' and value:
                # Direct image name/path
                self.stdout.write(f"  - Setting image from name: {value}")
                restaurant.image = value
        except Exception as e:
            self.stderr.write(self.style.ERROR(
                f"  - Error processing image {field_type}: {str(e)}"))

    def create_new_restaurant(self, data):
        """Create a new restaurant from data"""
        # Prepare the data for creating a restaurant
        restaurant_clean = {
            'name': data.get('name'),
            'cuisine': data.get('cuisine', 'Unknown'),
            'description': data.get('description', ''),
            'foods_on_menu': data.get('foods_on_menu', 0)
        }

        # Add image from raw path if available (highest priority)
        if 'image' in data and data['image']:
            restaurant_clean['image'] = data['image']
            self.stdout.write(f"  - Using raw image field: {data['image']}")
        # Or try to use image_url if available
        elif 'image_url' in data and data['image_url']:
            from django.conf import settings
            if data['image_url'].startswith(settings.MEDIA_URL):
                relative_path = data['image_url'][len(settings.MEDIA_URL):]
                restaurant_clean['image'] = relative_path
                self.stdout.write(
                    f"  - Setting image from URL: {data['image_url']} -> {relative_path}")
            else:
                self.stdout.write(
                    f"  - External image URL, can't process: {data['image_url']}")

        # Create the restaurant
        return Restaurant.objects.create(**restaurant_clean)

    def get_or_create_restaurant(self, restaurant_data):
        """Get or create restaurant, handling updates properly"""
        name = restaurant_data.get('name')
        restaurant = Restaurant.objects.filter(name__iexact=name).first()
        created = False

        if restaurant:
            # Update fields
            for key, value in restaurant_data.items():
                if key != 'name' and hasattr(restaurant, key) and value is not None:
                    setattr(restaurant, key, value)
            restaurant.save()
        else:
            # Clean data for new restaurant
            restaurant_clean = {
                'name': name,
                'cuisine': restaurant_data.get('cuisine', 'Unknown'),
                'description': restaurant_data.get('description', ''),
                'foods_on_menu': restaurant_data.get('foods_on_menu', 0)
            }

            # Add image if provided
            if 'image' in restaurant_data and restaurant_data['image']:
                restaurant_clean['image'] = restaurant_data['image']

            restaurant = Restaurant.objects.create(**restaurant_clean)
            created = True

        return restaurant, created

    def add_location(self, restaurant, latitude, longitude):
        """Add location to restaurant if it doesn't exist"""
        # Round coordinates
        latitude = round(float(latitude), 6)
        longitude = round(float(longitude), 6)

        # Check if location exists
        exists = Location.objects.filter(
            restaurant=restaurant,
            latitude=latitude,
            longitude=longitude
        ).exists()

        if not exists:
            Location.objects.create(
                restaurant=restaurant,
                latitude=latitude,
                longitude=longitude
            )
            return True
        return False
