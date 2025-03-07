from django.core.management.base import BaseCommand, CommandError
from core.models import Restaurant, Location
from django.db import connection


class Command(BaseCommand):
    help = 'Converts the ManyToMany relationship between Restaurant and Location into a OneToMany relationship'

    def add_arguments(self, parser):
        # Add the --apply argument as an optional flag
        parser.add_argument(
            '--apply',
            action='store_true',
            help='Apply the relationship changes after migration',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            'Starting conversion of Restaurant-Location relationships...')

        # Step 1: Get current relationships from the ManyToMany table
        relationships = []
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT location_id, restaurant_id FROM Locations_restaurants")
                relationships = cursor.fetchall()
                self.stdout.write(
                    f'Found {len(relationships)} existing relationships')
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'Error finding relationships: {str(e)}'))

        # Step 2: Run the migration to change the model structure
        self.stdout.write('Now run: python manage.py makemigrations')
        self.stdout.write('Then run: python manage.py migrate')
        self.stdout.write(
            'After migration is complete, run this command again with --apply flag')

        # Step 3: If --apply flag is given, apply the relationships to the new structure
        if options['apply']:
            self.stdout.write(
                'Applying relationships to the new model structure...')
            for location_id, restaurant_id in relationships:
                try:
                    location = Location.objects.get(id=location_id)
                    restaurant = Restaurant.objects.get(id=restaurant_id)
                    location.restaurant = restaurant
                    location.save()
                    self.stdout.write(
                        f'Updated location {location_id} with restaurant {restaurant_id}')
                except Location.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f'Location {location_id} not found'))
                except Restaurant.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f'Restaurant {restaurant_id} not found'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'Error updating location {location_id}: {str(e)}'))

            self.stdout.write(self.style.SUCCESS(
                'Successfully applied relationship changes'))
