import os
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import Restaurant, Food
from urllib.parse import unquote

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean up orphaned media files that are not referenced in the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Only show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Print detailed information about what is being checked and deleted',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        verbose = options.get('verbose', False)

        if dry_run:
            self.stdout.write(self.style.WARNING(
                "DRY RUN - No files will be deleted"))

        # Get all media files
        media_root = settings.MEDIA_ROOT
        restaurant_image_dir = os.path.join(media_root, 'restaurant_images')
        food_image_dir = os.path.join(media_root, 'food_images')

        # Get all referenced files from database
        referenced_files = self.get_referenced_files()
        if verbose:
            self.stdout.write(
                f"Found {len(referenced_files)} referenced files in database:")
            for ref in referenced_files:
                self.stdout.write(f"  - {ref}")

        # Clean up restaurant images
        deleted_restaurant_images = self.cleanup_directory(
            restaurant_image_dir,
            referenced_files,
            dry_run,
            verbose
        )

        # Clean up food images
        deleted_food_images = self.cleanup_directory(
            food_image_dir,
            referenced_files,
            dry_run,
            verbose
        )

        total_deleted = deleted_restaurant_images + deleted_food_images

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Found {total_deleted} orphaned media files that would be deleted"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully deleted {total_deleted} orphaned media files"
                )
            )

    def get_referenced_files(self):
        """Collect all media file paths referenced in the database"""
        referenced_files = set()

        # Get restaurant images
        for restaurant in Restaurant.objects.all():
            if restaurant.image and restaurant.image.name:
                # Handle both relative and absolute paths
                path = restaurant.image.name
                referenced_files.add(path)
                # Also add the URL-decoded version as files may be stored with encoded names
                referenced_files.add(unquote(path))

        # Get food images
        for food in Food.objects.all():
            if food.image and food.image.name:
                path = food.image.name
                referenced_files.add(path)
                referenced_files.add(unquote(path))

        # Get FoodChange images
        from core.models import FoodChange
        for food_change in FoodChange.objects.all():
            if food_change.new_image and food_change.new_image.name:
                path = food_change.new_image.name
                referenced_files.add(path)
                referenced_files.add(unquote(path))

        return referenced_files

    def cleanup_directory(self, directory, referenced_files, dry_run, verbose):
        """Remove orphaned media files from a directory"""
        deleted_count = 0

        if not os.path.exists(directory):
            self.stdout.write(f"Directory does not exist: {directory}")
            return deleted_count

        for root, dirs, files in os.walk(directory):
            for filename in files:
                # Skip .gitkeep and other hidden files
                if filename.startswith('.'):
                    continue

                file_path = os.path.join(root, filename)
                # Convert absolute path to relative path for comparison
                relative_path = os.path.relpath(file_path, settings.MEDIA_ROOT)

                # Check if this file is referenced
                is_referenced = False
                for ref_file in referenced_files:
                    # Handle Windows path separators
                    ref_normalized = ref_file.replace('\\', '/')
                    rel_normalized = relative_path.replace('\\', '/')

                    if ref_normalized == rel_normalized or ref_normalized.endswith(rel_normalized):
                        is_referenced = True
                        break

                if not is_referenced:
                    if verbose:
                        self.stdout.write(
                            f"Orphaned file found: {relative_path}")

                    if not dry_run:
                        try:
                            os.remove(file_path)
                            if verbose:
                                self.stdout.write(self.style.SUCCESS(
                                    f"Deleted: {relative_path}"))
                        except Exception as e:
                            self.stderr.write(
                                self.style.ERROR(
                                    f"Error deleting {relative_path}: {str(e)}")
                            )

                    deleted_count += 1

        return deleted_count
