from django.apps import AppConfig
import logging
from django.core import management

logger = logging.getLogger(__name__)


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        """
        Run tasks when Django starts.
        Note: This method can be called multiple times during startup
        """
        # Import is inside ready to avoid premature imports
        import os

        # Skip when running management commands to prevent circular imports
        # and redundant execution during migrations, collectstatic, etc.
        if os.environ.get('RUN_MAIN') == 'true' and not os.environ.get('DJANGO_SKIP_STARTUP_TASKS'):
            try:
                # Cleanup orphaned media files
                logger.info("Cleaning up orphaned media files...")
                management.call_command('cleanup_orphaned_media', verbosity=0)
                logger.info("Media cleanup completed successfully")
            except Exception as e:
                logger.error(f"Error during media cleanup: {str(e)}")
