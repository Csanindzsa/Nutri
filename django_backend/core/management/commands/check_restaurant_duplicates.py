import logging
from django.core.management.base import BaseCommand
from core.models import Restaurant
from django.db import connection

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Check for duplicate restaurant names and fix them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Fix duplicate restaurant names by adding suffixes',
        )

    def handle(self, *args, **options):
        fix_duplicates = options.get('fix', False)

        # Use a direct SQL query to find case-insensitive duplicates
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT LOWER(name) as lower_name, COUNT(*) as count, GROUP_CONCAT(id) as ids 
                FROM Restaurants 
                GROUP BY LOWER(name) 
                HAVING COUNT(*) > 1
            """)

            duplicates = cursor.fetchall()

        if not duplicates:
            self.stdout.write(self.style.SUCCESS(
                "No duplicate restaurant names found!"))
            return

        self.stdout.write(
            f"Found {len(duplicates)} duplicate restaurant names:")

        for duplicate in duplicates:
            lower_name, count, ids = duplicate
            self.stdout.write(
                f"'{lower_name}' appears {count} times. IDs: {ids}")

            if fix_duplicates:
                id_list = ids.split(',')
                # Skip the first one
                for i, restaurant_id in enumerate(id_list[1:], 1):
                    restaurant = Restaurant.objects.get(id=restaurant_id)
                    original_name = restaurant.name
                    new_name = f"{original_name} ({i})"
                    restaurant.name = new_name
                    restaurant.save()
                    self.stdout.write(self.style.SUCCESS(
                        f"  - Renamed restaurant ID {restaurant_id} from '{original_name}' to '{new_name}'"))

        if fix_duplicates:
            self.stdout.write(self.style.SUCCESS(
                "All duplicates have been fixed!"))
        else:
            self.stdout.write(self.style.WARNING(
                "To fix these duplicates, run again with the --fix flag"))
