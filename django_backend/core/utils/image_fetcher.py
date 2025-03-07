import requests
import os
import logging
import random
from urllib.parse import urlparse, quote_plus
from django.core.files.base import ContentFile
from django.conf import settings
import dotenv

dotenv.load_dotenv()

# Configure more detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use a specific path for the log file
log_dir = os.path.join(settings.BASE_DIR, 'logs')
# Create logs directory if it doesn't exist
os.makedirs(log_dir, exist_ok=True)
log_file_path = os.path.join(log_dir, 'image_fetcher.log')

file_handler = logging.FileHandler(log_file_path)
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)
logger.propagate = False

# Log the location of the log file itself for debugging
logger.info(f"Log file located at: {os.path.abspath(log_file_path)}")

# Use either Unsplash or Pexels API key - I'll provide both options
UNSPLASH_API_KEY = os.getenv('UNSPLASH_API_KEY')
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY')


def fetch_food_image(food_name, restaurant_name=None):
    """
    Fetch a food image from a free API based on the food name
    Returns a tuple: (success, image_content or error_message)
    """
    logger.info("========== NEW FOOD IMAGE REQUEST ==========")
    logger.info(
        f"Searching for food image: '{food_name}', restaurant: '{restaurant_name}'")

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

    logger.info(f"Food search queries (in order): {search_queries}")

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

                logger.info(
                    f"Pexels API request: {pexels_url} - params: {params}")

                response = requests.get(
                    pexels_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    photos = data.get('photos', [])

                    logger.info(
                        f"Pexels returned {len(photos)} results for query: '{query}'")

                    if photos:
                        # Pick from first 3 results for higher relevance
                        top_results = photos[:3] if len(
                            photos) >= 3 else photos
                        photo = random.choice(top_results)
                        image_url = photo['src']['medium']

                        # Log the chosen image details
                        logger.info(
                            f"Selected Pexels image: ID: {photo['id']}, URL: {image_url}")
                        logger.info(
                            f"Image description: {photo.get('alt', 'No description')}")
                        logger.info(
                            f"Photographer: {photo.get('photographer', 'Unknown')}")

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"SUCCESS: Found image for '{base_query}' using Pexels query: '{query}'")
                            return True, ContentFile(img_response.content)
                    else:
                        logger.info(
                            f"No photos found for Pexels query: '{query}'")
                else:
                    logger.warning(
                        f"Pexels API error: Status {response.status_code} - {response.text}")

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

                logger.info(
                    f"Unsplash API request: {unsplash_url} - params: {params}")

                response = requests.get(
                    unsplash_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    logger.info(
                        f"Unsplash returned {len(results)} results for query: '{query}'")

                    if results:
                        # Only pick from top 3 results for better relevance
                        top_results = results[:3] if len(
                            results) >= 3 else results
                        image = random.choice(top_results)
                        image_url = image['urls']['regular']

                        # Log the chosen image details
                        logger.info(
                            f"Selected Unsplash image: ID: {image['id']}, URL: {image_url}")
                        logger.info(
                            f"Image description: {image.get('description', 'No description') or image.get('alt_description', 'No alt description')}")
                        logger.info(
                            f"Photographer: {image.get('user', {}).get('name', 'Unknown')}")

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"SUCCESS: Found image for '{base_query}' using Unsplash query: '{query}'")
                            return True, ContentFile(img_response.content)
                    else:
                        logger.info(
                            f"No results found for Unsplash query: '{query}'")
                else:
                    logger.warning(
                        f"Unsplash API error: Status {response.status_code} - {response.text}")

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
        logger.info(f"Fallback URL: {fallback_url}")

        img_response = requests.get(fallback_url)
        if img_response.status_code == 200:
            logger.info(
                f"Found fallback image for '{base_query}' at final URL: {img_response.url}")
            return True, ContentFile(img_response.content)
    except Exception as e:
        logger.error(f"Error fetching fallback image: {str(e)}")

    logger.warning(
        f"FAILED: Could not find any relevant image for food: {food_name}")
    return False, "Could not fetch a relevant image for this food"


def fetch_restaurant_image(restaurant_name, cuisine=None):
    """
    Fetch a restaurant image based on the restaurant name and cuisine
    Returns a tuple: (success, image_content or error_message)
    """
    logger.info("========== NEW RESTAURANT IMAGE REQUEST ==========")
    logger.info(
        f"Searching for restaurant image: '{restaurant_name}', cuisine: '{cuisine}'")

    # Create more specific search queries for restaurant images
    base_query = restaurant_name.strip()

    # Keywords to exclude from all searches (will be added as negative terms)
    exclude_terms = "-flag -iran -emblem -symbol -map"

    # List of well-known restaurant chains for special handling
    well_known_chains = [
        "Starbucks", "McDonald's", "KFC", "Burger King", "Wendy's", "Subway",
        "Taco Bell", "Pizza Hut", "Domino's", "Chipotle", "Olive Garden",
        "Chili's", "Applebee's", "Outback Steakhouse", "Red Lobster",
        "Cheesecake Factory", "TGI Fridays", "Dunkin' Donuts", "Panera Bread"
    ]

    # Check if this is a well-known chain
    is_well_known = any(chain.lower() in base_query.lower()
                        for chain in well_known_chains)
    logger.info(f"Is well-known chain: {is_well_known}")

    # Make specific restaurant-related queries with stronger emphasis on branding
    if is_well_known:
        # For well-known chains, prioritize logo and brand identity
        search_queries = [
            f"{base_query} restaurant logo {exclude_terms}",
            f"{base_query} coffee shop entrance {exclude_terms}" if "coffee" in base_query.lower(
            ) or "starbucks" in base_query.lower() else f"{base_query} storefront {exclude_terms}",
            f"{base_query} restaurant exterior {exclude_terms}",
            f"{base_query} cafe building {exclude_terms}" if "cafe" in base_query.lower(
            ) else f"{base_query} restaurant building {exclude_terms}",
            f"{base_query} store {exclude_terms}",
        ]
    else:
        # For general restaurants
        search_queries = [
            f"{base_query} restaurant exterior {exclude_terms}",
            f"{base_query} cafe {exclude_terms}" if "cafe" in base_query.lower(
            ) else f"{base_query} restaurant {exclude_terms}",
            f"{base_query} restaurant storefront {exclude_terms}",
            f"{base_query} restaurant entrance {exclude_terms}",
            f"{base_query} dining {exclude_terms}",
        ]

    # If cuisine is available, add more specific queries
    if cuisine and len(cuisine.strip()) > 0:
        # Make sure cuisine doesn't have any terms that could trigger flag images
        safe_cuisine = cuisine.replace("iran", "").replace("flag", "")
        if safe_cuisine.strip():
            search_queries.insert(
                0, f"{base_query} {safe_cuisine} restaurant {exclude_terms}")

    logger.info(f"Restaurant search queries (in order): {search_queries}")

    # Function to check if image might be a flag (add basic URL and path checks)
    def might_be_flag(url):
        url_lower = url.lower()
        flag_indicators = ["flag", "iran", "iranian", "emblem", "national"]
        return any(indicator in url_lower for indicator in flag_indicators)

    # Try Pexels FIRST for restaurant images
    if PEXELS_API_KEY:
        for query in search_queries:
            try:
                logger.info(f"Trying Pexels with restaurant query: '{query}'")
                pexels_url = "https://api.pexels.com/v1/search"
                headers = {"Authorization": PEXELS_API_KEY}
                params = {
                    "query": query,
                    "per_page": 15,
                    "orientation": "landscape"
                }

                logger.info(
                    f"Pexels API request: {pexels_url} - params: {params}")

                response = requests.get(
                    pexels_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    photos = data.get('photos', [])

                    logger.info(
                        f"Pexels returned {len(photos)} results for query: '{query}'")

                    if photos:
                        # Filter out potential flag images by URL check
                        safe_photos = [
                            p for p in photos if not might_be_flag(p['url'])]
                        if not safe_photos:
                            safe_photos = photos  # Fallback if all are filtered

                        # Pick from first 3 results for higher relevance
                        top_results = safe_photos[:3] if len(
                            safe_photos) >= 3 else safe_photos
                        photo = random.choice(top_results)
                        image_url = photo['src']['medium']

                        # Log the chosen image details
                        logger.info(
                            f"Selected Pexels image: ID: {photo['id']}, URL: {image_url}")
                        logger.info(
                            f"Image description: {photo.get('alt', 'No description')}")
                        logger.info(
                            f"Photographer: {photo.get('photographer', 'Unknown')}")

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"Successfully found image for '{base_query}' restaurant using Pexels")
                            return True, ContentFile(img_response.content)
                    else:
                        logger.info(
                            f"No photos found for Pexels query: '{query}'")
                else:
                    logger.warning(
                        f"Pexels API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching restaurant image from Pexels with query '{query}': {str(e)}")

    # Try Unsplash with more specific queries to avoid flags
    if UNSPLASH_API_KEY:
        for query in search_queries:
            try:
                logger.info(
                    f"Trying Unsplash with restaurant query: '{query}'")
                unsplash_url = "https://api.unsplash.com/search/photos"
                headers = {"Authorization": f"Client-ID {UNSPLASH_API_KEY}"}
                params = {
                    "query": query,
                    "per_page": 10,
                    "orientation": "landscape",
                    "content_filter": "high",
                    "order_by": "relevant"
                }

                logger.info(
                    f"Unsplash API request: {unsplash_url} - params: {params}")

                response = requests.get(
                    unsplash_url, headers=headers, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])

                    logger.info(
                        f"Unsplash returned {len(results)} results for query: '{query}'")

                    if results:
                        # Filter out potential flag images by URL check
                        safe_results = [
                            r for r in results if not might_be_flag(r['urls']['regular'])]
                        if not safe_results:
                            safe_results = results  # Fallback if all are filtered

                        # Only pick from top 3 results for better relevance
                        top_results = safe_results[:3] if len(
                            safe_results) >= 3 else safe_results
                        image = random.choice(top_results)
                        image_url = image['urls']['regular']

                        # Log the chosen image details
                        logger.info(
                            f"Selected Unsplash image: ID: {image['id']}, URL: {image_url}")
                        logger.info(
                            f"Image description: {image.get('description', 'No description') or image.get('alt_description', 'No alt description')}")
                        logger.info(
                            f"Photographer: {image.get('user', {}).get('name', 'Unknown')}")

                        # Download the image
                        img_response = requests.get(image_url)
                        if img_response.status_code == 200:
                            logger.info(
                                f"Successfully found image for '{base_query}' restaurant using Unsplash")
                            return True, ContentFile(img_response.content)
                    else:
                        logger.info(
                            f"No results found for Unsplash query: '{query}'")
                else:
                    logger.warning(
                        f"Unsplash API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching restaurant image from Unsplash with query '{query}': {str(e)}")

    # Instead of the direct fallback which might be causing the flag issue, use a generic restaurant image
    try:
        # Use a very specific restaurant query that's unlikely to return flags
        fallback_query = "generic restaurant building storefront dining"
        encoded_query = quote_plus(fallback_query)
        fallback_url = f"https://source.unsplash.com/featured/?{encoded_query}"
        logger.info(f"Using generic restaurant fallback image")

        img_response = requests.get(fallback_url)
        if img_response.status_code == 200:
            logger.info(f"Found generic restaurant fallback image")
            return True, ContentFile(img_response.content)
    except Exception as e:
        logger.error(
            f"Error fetching generic restaurant fallback image: {str(e)}")

    logger.warning(
        f"FAILED: Could not find any relevant image for restaurant: {restaurant_name}")
    return False, "Could not fetch a relevant image for this restaurant"
