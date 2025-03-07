import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import Location

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Delete Location records that have NULL restaurant_id values'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)

        # Find all location records with NULL restaurant_id
        null_locations = Location.objects.filter(restaurant__isnull=True)
        count = null_locations.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS(
                'No Location records with NULL restaurant_id were found.'))
            return

        self.stdout.write(
            f'Found {count} Location records with NULL restaurant_id.')

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'DRY RUN: Would delete {count} Location records.'))
            # Show the first few records that would be deleted
            sample = null_locations[:5]
            self.stdout.write('Sample records:')
            for location in sample:
                self.stdout.write(
                    f'  - ID: {location.id}, Lat: {location.latitude}, Lng: {location.longitude}')

            self.stdout.write(self.style.WARNING(
                'Run this command without --dry-run to actually delete the records.'
            ))
            return

        # Delete the records in a transaction
        with transaction.atomic():
            deleted, _ = null_locations.delete()
            self.stdout.write(self.style.SUCCESS(
                f'Successfully deleted {deleted} Location records.'))


# If you want to run this from code instead of command line:
def clean_null_locations(dry_run=False):
    """
    Delete Location records that have NULL restaurant_id values

    Args:
        dry_run: If True, only show what would be deleted without deleting

    Returns:
        Tuple of (number_deleted, error_message)
    """
    try:
        null_locations = Location.objects.filter(restaurant__isnull=True)
        count = null_locations.count()

        if count == 0:
            return 0, "No locations to delete"

        if dry_run:
            return count, "Dry run - no deletions performed"

        with transaction.atomic():
            deleted, _ = null_locations.delete()
            return deleted, f"Successfully deleted {deleted} locations"

    except Exception as e:
        return 0, f"Error: {str(e)}"
