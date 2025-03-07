import json
import os
import logging
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Restaurant, Location

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Export restaurant data to a JSON file for later import'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to save the JSON file (default: restaurant_data.json in project root)',
        )
        parser.add_argument(
            '--with-locations',
            action='store_true',
            help='Include location data for restaurants',
        )

    def handle(self, *args, **options):
        # Use provided file path or default
        file_path = options.get('file')
        include_locations = options.get('with-locations', False)

        if not file_path:
            # Create data directory if it doesn't exist
            data_dir = os.path.join(settings.BASE_DIR, 'data')
            os.makedirs(data_dir, exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            file_path = os.path.join(
                data_dir, f'restaurant_data_{timestamp}.json')

        # Get restaurant data from the database
        restaurants_data = self.get_restaurants_data(include_locations)
        self.stdout.write(
            f"Found {len(restaurants_data)} restaurants to export")

        # Save to file
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(restaurants_data, f, ensure_ascii=False, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f'Restaurant data saved to {file_path}'))

    def get_restaurants_data(self, include_locations=False):
        """Get restaurant data from the database"""
        restaurants = Restaurant.objects.all()
        restaurants_data = []

        for restaurant in restaurants:
            # Get the raw image field value as stored in the database
            image_value = restaurant.image.name if restaurant.image else None

            # Attempt to get the full URL for front-end use
            image_url = None
            try:
                if restaurant.image and restaurant.image.name:
                    image_url = restaurant.image.url
                    self.stdout.write(
                        f"✓ Image URL for {restaurant.name}: {image_url}")
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"! Error getting image URL for {restaurant.name}: {str(e)}"))

            # Create restaurant data dictionary with all image information
            restaurant_data = {
                'name': restaurant.name,
                'cuisine': restaurant.cuisine,
                'description': restaurant.description or '',
                'foods_on_menu': restaurant.foods_on_menu,
                'image': image_value,  # The raw DB value - most important for import
                'image_url': image_url,  # Full URL for display
            }

            # Print debug info about the image
            self.stdout.write(f"  Restaurant: {restaurant.name}")
            self.stdout.write(f"  - Raw image field: {image_value}")
            self.stdout.write(f"  - Image URL: {image_url}")

            # Include location data if requested
            if include_locations:
                locations = Location.objects.filter(restaurant=restaurant)
                if locations.exists():
                    location = locations.first()
                    restaurant_data['latitude'] = location.latitude
                    restaurant_data['longitude'] = location.longitude

            restaurants_data.append(restaurant_data)

        # Print summary of images found
        restaurants_with_images = sum(
            1 for r in restaurants_data if r.get('image'))
        self.stdout.write(
            f"Restaurants with images: {restaurants_with_images}/{len(restaurants_data)}")

        return restaurants_data
