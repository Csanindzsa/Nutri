import requests
import os
import logging
import random
from urllib.parse import urlparse, quote_plus
from django.core.files.base import ContentFile
from django.conf import settings
import dotenv

dotenv.load_dotenv()
logger = logging.getLogger(__name__)

# Use either Unsplash or Pexels API key - I'll provide both options
UNSPLASH_API_KEY = os.getenv('UNSPLASH_API_KEY')
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY')


def fetch_food_image(food_name, restaurant_name=None):
    """
    Fetch a food image from a free API based on the food name
    Returns a tuple: (success, image_content or error_message)
    """
    # Create more specific search queries for better results
    base_query = food_name.strip()

    # Make very specific food-related queries to prevent wrong results
    search_queries = [
        f"{base_query} food exact dish",  # Most specific
        f"{base_query} food meal",
        f"{base_query} food closeup",
        f"{base_query} dish served",
    ]

    # If restaurant name is available, add it to the search queries
    if restaurant_name and len(restaurant_name.strip()) > 0:
        search_queries.insert(0, f"{base_query} food from {restaurant_name}")

    logger.info(f"Trying to fetch image for food: {food_name}")

    # Try Pexels FIRST - switching the order as requested
    if PEXELS_API_KEY:
        for query in search_queries:
            try:
                logger.info(f"Trying Pexels with query: '{query}'")
                pexels_url = "https://api.pexels.com/v1/search"
                headers = {"Authorization": PEXELS_API_KEY}
                params = {
                    "query": query,
                    "per_page": 15,
                    "size": "medium",
                    "orientation": "landscape"
                }

                response = requests.get(
                    pexels_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    photos = data.get('photos', [])

                    if photos:
                        # Pick from first 3 results for higher relevance
                        top_results = photos[:3] if len(
                            photos) >= 3 else photos
                        photo = random.choice(top_results)
                        image_url = photo['src']['medium']

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"Successfully found image for '{base_query}' using Pexels")
                            return True, ContentFile(img_response.content)

                logger.info(f"No results from Pexels for query: '{query}'")

            except Exception as e:
                logger.error(
                    f"Error fetching image from Pexels with query '{query}': {str(e)}")

    # Try Unsplash as a fallback
    if UNSPLASH_API_KEY:
        for query in search_queries:
            try:
                logger.info(f"Trying Unsplash with query: '{query}'")
                unsplash_url = "https://api.unsplash.com/search/photos"
                headers = {"Authorization": f"Client-ID {UNSPLASH_API_KEY}"}
                params = {
                    "query": query,
                    "per_page": 10,
                    "orientation": "landscape",
                    "content_filter": "high",
                    "order_by": "relevant"  # Be sure to use relevant ordering
                }

                response = requests.get(
                    unsplash_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    if results:
                        # Only pick from top 3 results for better relevance
                        top_results = results[:3] if len(
                            results) >= 3 else results
                        image = random.choice(top_results)
                        image_url = image['urls']['regular']

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"Successfully found image for '{base_query}' using Unsplash")
                            return True, ContentFile(img_response.content)

                logger.info(f"No results from Unsplash for query: '{query}'")

            except Exception as e:
                logger.error(
                    f"Error fetching image from Unsplash with query '{query}': {str(e)}")

    # Use unsplash source direct API as last resort with a very specific query
    try:
        # Create a highly specific query
        exact_query = f"{base_query.lower()}-food-dish-meal"
        encoded_query = quote_plus(exact_query)
        fallback_url = f"https://source.unsplash.com/featured/?{encoded_query}"
        logger.info(
            f"Trying direct fallback image search with: '{exact_query}'")

        img_response = requests.get(fallback_url)
        if img_response.status_code == 200:
            logger.info(f"Found fallback image for '{base_query}'")
            return True, ContentFile(img_response.content)
    except Exception as e:
        logger.error(f"Error fetching fallback image: {str(e)}")

    logger.warning(f"Failed to find relevant image for food: {food_name}")
    return False, "Could not fetch a relevant image for this food"
