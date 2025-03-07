# Restaurant Data Backup and Restore Guide

This guide explains how to backup your restaurant data and restore it if needed.

## Backing Up Restaurant Data

You can backup restaurant data using the management command:

Restoring Restaurant Data
You can restore restaurant data from a backup file using:

# First check what would be imported without making changes

python manage.py import_restaurants_from_file data/restaurant_data_20250307_180000.json --dry-run

# When ready, perform the actual import

python manage.py import_restaurants_from_file data/restaurant_data_20250307_180000.json

Handling Duplicate Restaurants
If you encounter issues with duplicate restaurant names, you can use:

# Find duplicate restaurant names

python manage.py check_restaurant_duplicates

# Fix duplicates by adding numeric suffixes

python manage.py check_restaurant_duplicates --fix

Merging Restaurant Data Files
If you have separate files with restaurant data and images, you can merge them:

# Merge data files and optionally import

python manage.py merge_restaurant_data --image-file=restaurant_data_20250307_175019.json --location-file=restaurant_data_20250307_174817.json

python manage.py merge_restaurant_data --image-file=restaurant_data_20250307_175019.json --location-file=restaurant_data_20250307_174817.json --import

API Backup Integration
The application has an API endpoint that sends restaurant data to be saved:

/api/restaurants/batch-save/

This endpoint now returns a preview of what would happen if the restaurants were imported, without actually saving them to a file. To save the data to a file, use the management commands described above.
