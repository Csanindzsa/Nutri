from django.core.management.base import BaseCommand
from core.services.restaurant_service import RestaurantService


class Command(BaseCommand):
    help = 'Process any pending food changes that have reached the approval threshold'

    def handle(self, *args, **options):
        self.stdout.write("Processing pending food changes...")
        count = RestaurantService.process_pending_food_changes()
        self.stdout.write(self.style.SUCCESS(
            f"Successfully processed {count} pending food changes"))
