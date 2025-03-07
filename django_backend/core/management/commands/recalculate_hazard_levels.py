from django.core.management.base import BaseCommand
from core.models import Restaurant
from core.services.restaurant_service import RestaurantService


class Command(BaseCommand):
    help = 'Recalculates hazard levels for all restaurants based on their foods'

    def handle(self, *args, **options):
        restaurants = Restaurant.objects.all()
        count = 0
        total = restaurants.count()

        self.stdout.write(
            f"Recalculating hazard levels for {total} restaurants...")

        for restaurant in restaurants:
            hazard_level = RestaurantService.update_restaurant_hazard_level(
                restaurant.id)
            if hazard_level is not None:
                count += 1
                self.stdout.write(
                    f"Updated {restaurant.name} to hazard level {hazard_level}")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated {count} out of {total} restaurants"))
