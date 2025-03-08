from django.apps import AppConfig
import logging
import threading
import time

logger = logging.getLogger(__name__)


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Run tasks when Django starts.
        Note: This method can be called multiple times during startup
        """
        # Only run in the main process (avoid running twice with Django development server)
        import sys
        if 'runserver' not in sys.argv or ('--noreload' in sys.argv or sys.argv[1] == 'runserver'):
            # Import signals to register them
            from . import signals

            # Start background tasks to fetch missing images
            # We do this in threads to avoid blocking startup
            def run_fetch_missing_food_images():
                # Sleep for a few seconds to allow full server startup
                time.sleep(5)

                logger.info(
                    "Starting background task to fetch missing food images")
                try:
                    from django.core.management import call_command
                    call_command('fetch_missing_images',
                                 limit=50,  # Process up to 50 foods at startup
                                 batch_size=10,  # Use underscore here as well
                                 delay=1.0)  # 1 second delay between requests
                    logger.info("Food image fetch task completed")
                except Exception as e:
                    logger.error(
                        f"Error running food image fetch task: {str(e)}")

            def run_fetch_missing_restaurant_images():
                # Sleep for a few seconds to allow full server startup
                # Start slightly after food images to avoid API rate issues
                time.sleep(8)

                logger.info(
                    "Starting background task to fetch missing restaurant images")
                try:
                    from django.core.management import call_command
                    call_command('fetch_missing_restaurant_images',
                                 limit=30,  # Process up to 30 restaurants at startup
                                 batch_size=10,
                                 delay=1.0)  # 1 second delay between requests
                    logger.info("Restaurant image fetch task completed")
                except Exception as e:
                    logger.error(
                        f"Error running restaurant image fetch task: {str(e)}")

            # Start in separate threads
            food_image_thread = threading.Thread(
                target=run_fetch_missing_food_images)
            food_image_thread.daemon = True
            food_image_thread.start()
            logger.info("Background food image fetch thread started")

            restaurant_image_thread = threading.Thread(
                target=run_fetch_missing_restaurant_images)
            restaurant_image_thread.daemon = True
            restaurant_image_thread.start()
            logger.info("Background restaurant image fetch thread started")
