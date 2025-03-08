import logging
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from core.models import Food
from core.utils.image_fetcher import fetch_food_image, pexels_limiter, unsplash_limiter

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetch missing images for foods that don\'t have images yet'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=None,
                            help='Limit the number of foods to process')
        parser.add_argument('--batch-size', type=int, default=10,
                            help='Number of foods to process in each batch')
        parser.add_argument('--delay', type=float, default=1.0,
                            help='Delay between API requests in seconds')
        parser.add_argument('--continue-on-rate-limit', action='store_true',
                            help='If set, will pause and continue when rate limits reset instead of stopping')
        parser.add_argument('--max-failures', type=int, default=5,
                            help='Stop processing after this many consecutive failures')

    def handle(self, *args, **options):
        # Get foods without images
        foods_without_images = Food.objects.filter(image='').order_by('id')

        # Apply limit if specified
        limit = options['limit']
        if limit is not None:
            foods_without_images = foods_without_images[:limit]

        total_foods = foods_without_images.count()
        self.stdout.write(f"Found {total_foods} foods without images")

        if total_foods == 0:
            self.stdout.write(self.style.SUCCESS("No foods missing images"))
            return

        batch_size = options['batch_size']
        delay = options['delay']
        continue_on_rate_limit = options.get('continue_on_rate_limit', False)
        # Get the failure threshold
        max_failures = options.get('max_failures', 5)
        success_count = 0
        rate_limit_hit = False
        consecutive_failures = 0  # Track consecutive failures

        # Process in batches
        for i in range(0, total_foods, batch_size):
            batch = foods_without_images[i:i+batch_size]
            self.stdout.write(
                f"Processing batch {i//batch_size + 1}/{(total_foods + batch_size - 1)//batch_size}")

            for food in batch:
                # Check if we've hit rate limits
                pexels_remaining = pexels_limiter.get_remaining()
                unsplash_remaining = unsplash_limiter.get_remaining()

                if pexels_remaining == 0 and unsplash_remaining == 0:
                    self.stdout.write(self.style.WARNING(
                        "API rate limits reached! No more requests can be made."
                    ))

                    if continue_on_rate_limit:
                        # Calculate time until reset
                        reset_time = min(pexels_limiter.get_reset_time(
                        ), unsplash_limiter.get_reset_time())
                        # Add 10s buffer
                        wait_seconds = max(
                            1, (reset_time - datetime.now()).total_seconds() + 10)

                        self.stdout.write(self.style.WARNING(
                            f"Waiting {wait_seconds/60:.1f} minutes for API rate limits to reset..."
                        ))

                        # Wait until reset time
                        time.sleep(wait_seconds)
                        self.stdout.write(self.style.SUCCESS(
                            "Resuming after rate limit reset"))
                    else:
                        # Stop processing if not continuing on rate limit
                        rate_limit_hit = True
                        break

                # Check if we've hit max consecutive failures
                if consecutive_failures >= max_failures:
                    self.stdout.write(self.style.WARNING(
                        f"Stopping due to {consecutive_failures} consecutive failures."
                    ))
                    self.stdout.write(self.style.WARNING(
                        "Consider checking API keys or raising the failure threshold."
                    ))
                    return

                try:
                    self.stdout.write(
                        f"Fetching image for {food.name} (ID: {food.id})")

                    # Get restaurant name if available
                    restaurant_name = None
                    if food.restaurant:
                        restaurant_name = food.restaurant.name

                    # Try to fetch an image
                    success, image_content_or_error = fetch_food_image(
                        food.name, restaurant_name)

                    if success:
                        # Generate a filename
                        image_name = f"auto_generated_{food.id}_{food.name.replace(' ', '_')}.jpg"

                        # Save the image to the food object
                        food.image.save(
                            image_name, image_content_or_error, save=True)
                        success_count += 1

                        # Reset consecutive failures counter on success
                        consecutive_failures = 0

                        self.stdout.write(self.style.SUCCESS(
                            f"Successfully added image for {food.name} (ID: {food.id})"
                        ))
                    else:
                        # Increment consecutive failures counter
                        consecutive_failures += 1

                        self.stdout.write(self.style.WARNING(
                            f"Failed to fetch image for {food.name}: {image_content_or_error} "
                            f"(Consecutive failures: {consecutive_failures}/{max_failures})"
                        ))

                except Exception as e:
                    # Also count exceptions as failures
                    consecutive_failures += 1

                    self.stdout.write(self.style.ERROR(
                        f"Error processing {food.name} (ID: {food.id}): {str(e)} "
                        f"(Consecutive failures: {consecutive_failures}/{max_failures})"
                    ))

                # Add delay to avoid hitting API rate limits
                if delay > 0:
                    time.sleep(delay)

            # Break out of outer loop if rate limit was hit and not continuing
            if rate_limit_hit and not continue_on_rate_limit:
                self.stdout.write(self.style.WARNING(
                    f"Stopping due to API rate limits. {success_count}/{total_foods} images added."
                ))
                self.stdout.write(self.style.WARNING(
                    "Use --continue-on-rate-limit to pause and continue when limits reset."
                ))
                break

            # Show progress after each batch
            processed = min((i + batch_size), total_foods)
            self.stdout.write(
                f"Processed {processed}/{total_foods} foods, {success_count} images added")

        self.stdout.write(self.style.SUCCESS(
            f"Complete! Added images to {success_count}/{total_foods} foods"
        ))
