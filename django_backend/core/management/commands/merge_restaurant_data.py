import json
import os
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Restaurant, Location
from django.conf import settings
from pathlib import Path

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Merge two restaurant data files and import the combined data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--image-file',
            type=str,
            required=False,
            help='Path to JSON file with restaurant image data',
            default='restaurant_data_20250307_175019.json',
        )
        parser.add_argument(
            '--location-file',
            type=str,
            required=False,
            help='Path to JSON file with restaurant location data',
            default='restaurant_data_20250307_174817.json',
        )
        parser.add_argument(
            '--output-file',
            type=str,
            required=False,
            help='Path to output merged JSON data',
        )
        parser.add_argument(
            '--import',
            action='store_true',
            dest='import_data',
            help='Import the merged data into the database',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview what would be imported without making changes',
        )

    def handle(self, *args, **options):
        data_dir = os.path.join(settings.BASE_DIR, 'data')

        # Get file paths
        image_file = os.path.join(data_dir, options['image_file'])
        location_file = os.path.join(data_dir, options['location_file'])

        # Default output file name (if not provided)
        if options.get('output_file'):
            output_file = options['output_file']
        else:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = os.path.join(
                data_dir, f'merged_restaurant_data_{timestamp}.json')

        # Check if files exist
        if not os.path.exists(image_file):
            self.stderr.write(self.style.ERROR(
                f"Image data file not found: {image_file}"))
            return

        if not os.path.exists(location_file):
            self.stderr.write(self.style.ERROR(
                f"Location data file not found: {location_file}"))
            return

        # Load the data
        try:
            with open(image_file, 'r', encoding='utf-8') as f:
                image_data = json.load(f)
            self.stdout.write(
                f"Loaded {len(image_data)} restaurants from image file")

            with open(location_file, 'r', encoding='utf-8') as f:
                location_data = json.load(f)
            self.stdout.write(
                f"Loaded {len(location_data)} restaurants from location file")

            # Create a map of restaurants from image data for quick lookup
            image_restaurants = {}
            for restaurant in image_data:
                name = restaurant['name'].lower()
                image_restaurants[name] = restaurant

            # Merge the data by name
            merged_restaurants = []
            matched_count = 0

            for loc_restaurant in location_data:
                restaurant_name = loc_restaurant['name'].lower()
                merged_restaurant = loc_restaurant.copy()  # Start with location data

                # Add image data if available
                if restaurant_name in image_restaurants:
                    matched_count += 1
                    img_restaurant = image_restaurants[restaurant_name]

                    # Add image fields to the merged data
                    merged_restaurant['image'] = img_restaurant.get('image')
                    merged_restaurant['image_url'] = img_restaurant.get(
                        'image_url')

                    # Remove temporary ID (we'll generate a proper one on import)
                    if 'id' in merged_restaurant and merged_restaurant['id'] < 0:
                        del merged_restaurant['id']

                merged_restaurants.append(merged_restaurant)

            self.stdout.write(self.style.SUCCESS(
                f"Matched {matched_count} out of {len(location_data)} restaurants with images"))
            self.stdout.write(
                f"Created {len(merged_restaurants)} merged restaurant records")

            # Save merged data
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(merged_restaurants, f, ensure_ascii=False, indent=2)
            self.stdout.write(self.style.SUCCESS(
                f"Merged data saved to {output_file}"))

            # Import the data if requested
            if options['import_data']:
                if options['dry_run']:
                    self.import_data(merged_restaurants, dry_run=True)
                else:
                    self.import_data(merged_restaurants)

        except Exception as e:
            self.stderr.write(self.style.ERROR(
                f"Error processing files: {str(e)}"))

    def import_data(self, restaurants_data, dry_run=False):
        """Import the merged restaurant data into the database"""
        if dry_run:
            self.stdout.write(self.style.WARNING(
                "DRY RUN - No changes will be made"))

        created = 0
        updated = 0
        errors = 0

        for restaurant_data in restaurants_data:
            try:
                name = restaurant_data.get('name', '')
                if not name:
                    continue

                if dry_run:
                    # Just check if restaurant exists
                    exists = Restaurant.objects.filter(
                        name__iexact=name).exists()
                    action = "Would update" if exists else "Would create"
                    self.stdout.write(f"{action}: {name}")
                    continue

                # Non-dry run - actually make changes
                with transaction.atomic():
                    # Extract location data
                    latitude = restaurant_data.pop('latitude', None)
                    longitude = restaurant_data.pop('longitude', None)

                    # Extract image data
                    image_path = restaurant_data.pop('image', None)
                    image_url = restaurant_data.pop('image_url', None)

                    # Remove extra fields not in the Restaurant model
                    for field in ['id', 'distance', 'formattedDistance', 'osmId']:
                        restaurant_data.pop(field, None)

                    # Look for existing restaurant
                    restaurant = Restaurant.objects.filter(
                        name__iexact=name).first()

                    if restaurant:
                        # Update existing restaurant
                        updated += 1
                        # Update fields
                        for key, value in restaurant_data.items():
                            if hasattr(restaurant, key) and value is not None:
                                setattr(restaurant, key, value)

                        # Set image if provided
                        if image_path:
                            restaurant.image = image_path

                        restaurant.save()
                        self.stdout.write(self.style.SUCCESS(
                            f"Updated restaurant: {name}"))
                    else:
                        # Create new restaurant
                        restaurant_data_clean = {
                            'name': name,
                            'cuisine': restaurant_data.get('cuisine', 'Unknown'),
                            'description': restaurant_data.get('description', ''),
                            'foods_on_menu': restaurant_data.get('foods_on_menu', 0),
                        }

                        # Add image if provided
                        if image_path:
                            restaurant_data_clean['image'] = image_path

                        restaurant = Restaurant.objects.create(
                            **restaurant_data_clean)
                        created += 1
                        self.stdout.write(self.style.SUCCESS(
                            f"Created restaurant: {name}"))

                    # Always add location data if available
                    if latitude is not None and longitude is not None:
                        # Round coordinates
                        latitude = round(float(latitude), 6)
                        longitude = round(float(longitude), 6)

                        # Check if location exists
                        location_exists = Location.objects.filter(
                            restaurant=restaurant,
                            latitude=latitude,
                            longitude=longitude
                        ).exists()

                        if not location_exists:
                            Location.objects.create(
                                restaurant=restaurant,
                                latitude=latitude,
                                longitude=longitude
                            )
                            self.stdout.write(
                                f"  - Added location ({latitude}, {longitude})")

            except Exception as e:
                errors += 1
                self.stderr.write(self.style.ERROR(
                    f"Error processing restaurant {name}: {str(e)}"))

        if not dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"Import complete: Created {created}, Updated {updated}, Errors {errors}"))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Dry run complete: Would create/update {len(restaurants_data)} restaurants"))
