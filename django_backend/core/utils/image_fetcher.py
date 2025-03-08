import requests
import os
import logging
import random
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlparse, quote_plus
from django.core.files.base import ContentFile
from django.conf import settings
import dotenv

dotenv.load_dotenv()

# Configure more robust logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('image_fetcher')  # Use a specific logger name

# First try to log to console so we can see messages immediately
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# Try to create log file in a location that definitely should be writable
try:
    # First try the Django-specified location
    if hasattr(settings, 'BASE_DIR'):
        log_dir = Path(settings.BASE_DIR) / 'logs'
    else:
        # Fallback to a location relative to this file
        current_dir = Path(__file__).parent
        log_dir = current_dir / 'logs'

    # Create logs directory with explicit mode
    os.makedirs(log_dir, mode=0o755, exist_ok=True)
    log_file_path = log_dir / 'image_fetcher.log'

    # Try to open the file to test if it's writable
    with open(log_file_path, 'a') as f:
        pass  # Just testing if we can write

    # Now set up the file handler
    file_handler = logging.FileHandler(str(log_file_path))
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(file_formatter)
    logger.addHandler(file_handler)

    # Print and log the location
    print(f"Log file path: {log_file_path}")
    logger.info(f"Log file active at: {log_file_path.resolve()}")

except Exception as e:
    # If file logging fails, log to console and try an alternative location
    print(f"Error setting up log file: {e}")
    logger.error(f"Error setting up log file: {e}")

    try:
        # Fallback to a temporary folder
        temp_log_path = Path(os.environ.get(
            'TEMP', '/tmp')) / 'image_fetcher.log'
        file_handler = logging.FileHandler(str(temp_log_path))
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

        print(f"Using fallback log location: {temp_log_path}")
        logger.info(f"Using fallback log location: {temp_log_path}")
    except Exception as e2:
        print(
            f"Failed to set up fallback logging: {e2}. Logging to console only.")

# Ensure logger propagates messages correctly
logger.propagate = False  # Don't propagate to root logger to avoid duplicate logs
logger.setLevel(logging.INFO)  # Ensure logger itself has correct level

# Test log message
logger.info("Image fetcher logger initialized")

# Use either Unsplash or Pexels API key - I'll provide both options
UNSPLASH_API_KEY = os.getenv('UNSPLASH_API_KEY')
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY')

# Add these imports for translation
try:
    from googletrans import Translator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    logger.warning(
        "googletrans library not available. Translation features will be disabled.")
    logger.warning(
        "To enable translation, install with: pip install googletrans==4.0.0-rc1")

# Create translator instance if available
translator = Translator() if TRANSLATOR_AVAILABLE else None

# Add a rate limiter class to track API requests


class ApiRateLimiter:
    def __init__(self, limit_per_hour=200):
        self.limit_per_hour = limit_per_hour
        self.request_timestamps = []
        self.last_reset = datetime.now()
        self.enabled = True  # Can be disabled for testing

    def add_request(self):
        """Record a new API request"""
        now = datetime.now()
        self._reset_if_needed(now)
        self.request_timestamps.append(now)

    def can_make_request(self):
        """Check if a new request can be made without exceeding the rate limit"""
        if not self.enabled:
            return True  # Always allow if rate limiting is disabled

        now = datetime.now()
        self._reset_if_needed(now)
        return len(self.request_timestamps) < self.limit_per_hour

    def _reset_if_needed(self, now=None):
        """Reset the counter if an hour has passed since the last reset"""
        if now is None:
            now = datetime.now()

        # Reset if it's been more than an hour since the last reset
        if now - self.last_reset > timedelta(hours=1):
            self.request_timestamps = []
            self.last_reset = now
            logger.info(f"API rate limit counter reset at {now}")

    def get_remaining(self):
        """Get the number of remaining requests in the current hour"""
        self._reset_if_needed()
        return max(0, self.limit_per_hour - len(self.request_timestamps))

    def get_reset_time(self):
        """Get the time when the rate limit will reset"""
        return self.last_reset + timedelta(hours=1)


# Create rate limiter instances
# Pexels limit: 200 requests per hour
pexels_limiter = ApiRateLimiter(limit_per_hour=200)
# Unsplash limit is much higher but adding for safety
unsplash_limiter = ApiRateLimiter(limit_per_hour=50)


def detect_and_translate_to_english(text):
    """
    Detects the language of text and translates it to English if needed.
    Returns the translated text and whether it was translated.
    """
    if not text or not TRANSLATOR_AVAILABLE:
        return text, False

    try:
        # Detect language
        detection = translator.detect(text)
        source_lang = detection.lang

        # If already English, return as is
        if (source_lang == 'en'):
            logger.info(f"Text '{text}' already in English")
            return text, False

        # Translate to English
        translated = translator.translate(text, src=source_lang, dest='en')
        logger.info(
            f"Translated '{text}' from {source_lang} to English: '{translated.text}'")
        return translated.text, True

    except Exception as e:
        logger.warning(f"Translation error for '{text}': {e}")
        return text, False  # Return original if translation fails


def fetch_food_image(food_name, restaurant_name=None):
    """
    Fetch a food image from a free API based on the food name
    Returns a tuple: (success, image_content or error_message)
    """
    logger.info("========== NEW FOOD IMAGE REQUEST ==========")
    logger.info(
        f"Original food name: '{food_name}', restaurant: '{restaurant_name}'")

    # Check rate limits before proceeding
    pexels_remaining = pexels_limiter.get_remaining()
    unsplash_remaining = unsplash_limiter.get_remaining()
    logger.info(f"API rate limits: Pexels {pexels_remaining}/{pexels_limiter.limit_per_hour} remaining, "
                f"Unsplash {unsplash_remaining}/{unsplash_limiter.limit_per_hour} remaining")

    if pexels_remaining == 0 and unsplash_remaining == 0:
        reset_time = min(pexels_limiter.get_reset_time(),
                         unsplash_limiter.get_reset_time())
        minutes_to_reset = max(
            0, int((reset_time - datetime.now()).total_seconds() / 60))
        logger.warning(
            f"API rate limits exhausted! Will reset in approximately {minutes_to_reset} minutes")
        return False, "API rate limits reached. Please try again later."

    # Translate food name and restaurant name to English if needed
    food_name_en, food_translated = detect_and_translate_to_english(food_name)

    restaurant_name_en = restaurant_name
    if restaurant_name:
        restaurant_name_en, restaurant_translated = detect_and_translate_to_english(
            restaurant_name)

    if food_translated or (restaurant_name and restaurant_translated):
        logger.info(
            f"Translated to English: food name = '{food_name_en}', restaurant = '{restaurant_name_en}'")

    # Create more specific search queries using translated names
    base_query = food_name_en.strip()

    # Make very specific food-related queries to prevent wrong results
    search_queries = [
        f"{base_query} food exact dish",  # Most specific
        f"{base_query} food meal",
        f"{base_query} food closeup",
        f"{base_query} dish served",
    ]

    # If restaurant name is available, add it to the search queries
    if restaurant_name_en and len(restaurant_name_en.strip()) > 0:
        search_queries.insert(
            0, f"{base_query} food from {restaurant_name_en}")

    logger.info(f"Food search queries (in order): {search_queries}")

    # Try Pexels FIRST - switching the order as requested
    if PEXELS_API_KEY and pexels_limiter.can_make_request():
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

                # Record this request in the rate limiter
                pexels_limiter.add_request()

                response = requests.get(
                    pexels_url, headers=headers, params=params)
                remaining = response.headers.get('X-Ratelimit-Remaining')
                if remaining:
                    logger.info(
                        f"Pexels API reported {remaining} requests remaining")

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
                elif response.status_code == 429:  # Too many requests
                    logger.warning("Pexels API rate limit reached!")
                    # Mark the rate limiter as exhausted
                    while pexels_limiter.can_make_request():
                        pexels_limiter.add_request()
                    break  # Exit the Pexels loop and try Unsplash
                else:
                    logger.warning(
                        f"Pexels API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching image from Pexels with query '{query}': {str(e)}")

    # Try Unsplash as a fallback
    if UNSPLASH_API_KEY and unsplash_limiter.can_make_request():
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

                # Record this request in the rate limiter
                unsplash_limiter.add_request()

                response = requests.get(
                    unsplash_url, headers=headers, params=params)
                remaining = response.headers.get('X-Ratelimit-Remaining')
                if remaining:
                    logger.info(
                        f"Unsplash API reported {remaining} requests remaining")

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
                elif response.status_code == 429:  # Too many requests
                    logger.warning("Unsplash API rate limit reached!")
                    # Mark the rate limiter as exhausted
                    while unsplash_limiter.can_make_request():
                        unsplash_limiter.add_request()
                    break  # Exit the Unsplash loop
                else:
                    logger.warning(
                        f"Unsplash API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching image from Unsplash with query '{query}': {str(e)}")

    # Use unsplash source direct API as last resort only if we haven't hit the limit
    if pexels_limiter.get_remaining() == 0 and unsplash_limiter.get_remaining() == 0:
        logger.warning(
            "All API rate limits reached. Skipping direct fallback to prevent further rate limit issues.")
    else:
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
        f"Original restaurant name: '{restaurant_name}', cuisine: '{cuisine}'")

    # Check rate limits before proceeding
    pexels_remaining = pexels_limiter.get_remaining()
    unsplash_remaining = unsplash_limiter.get_remaining()
    logger.info(f"API rate limits: Pexels {pexels_remaining}/{pexels_limiter.limit_per_hour} remaining, "
                f"Unsplash {unsplash_remaining}/{unsplash_limiter.limit_per_hour} remaining")

    if pexels_remaining == 0 and unsplash_remaining == 0:
        reset_time = min(pexels_limiter.get_reset_time(),
                         unsplash_limiter.get_reset_time())
        minutes_to_reset = max(
            0, int((reset_time - datetime.now()).total_seconds() / 60))
        logger.warning(
            f"API rate limits exhausted! Will reset in approximately {minutes_to_reset} minutes")
        return False, "API rate limits reached. Please try again later."

    # Translate restaurant name and cuisine to English if needed
    restaurant_name_en, restaurant_translated = detect_and_translate_to_english(
        restaurant_name)

    # Only translate cuisine if it's provided and not "Unknown"
    cuisine_en = cuisine
    cuisine_translated = False
    if cuisine and cuisine.lower() not in ['unknown', 'unkown', '']:
        cuisine_en, cuisine_translated = detect_and_translate_to_english(
            cuisine)

    if restaurant_translated or cuisine_translated:
        logger.info(
            f"Translated to English: restaurant name = '{restaurant_name_en}', cuisine = '{cuisine_en}'")

    # Create more specific search queries for restaurant images using translated terms
    base_query = restaurant_name_en.strip()

    # Keywords to exclude from all searches (will be added as negative terms)
    # exclude_terms = "-flag -iran -emblem -symbol -map"
    exclude_terms = ""

    # List of well-known restaurant chains for special handling
    well_known_chains = [
        "Starbucks", "McDonald's", "KFC", "Burger King", "Wendy's", "Subway",
        "Taco Bell", "Pizza Hut", "Domino's", "Chipotle", "Olive Garden",
        "Chili's", "Applebee's", "Outback Steakhouse", "Red Lobster",
        "Cheesecake Factory", "TGI Fridays", "Dunkin' Donuts", "Panera Bread"
    ]

    # Check if this is a well-known chain (use translated name)
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

    # Use translated cuisine in cuisine-specific queries
    if cuisine_en and len(cuisine_en.strip()) > 0 and cuisine_en.lower() not in ['unknown', 'unkown']:
        # Make sure cuisine doesn't have any terms that could trigger flag images
        safe_cuisine = cuisine_en.replace("iran", "").replace("flag", "")
        if safe_cuisine.strip():
            search_queries.insert(
                0, f"{base_query} {safe_cuisine} restaurant {exclude_terms}")
            logger.info(
                f"Added cuisine-specific query with cuisine: {safe_cuisine}")
    elif cuisine:
        logger.info(
            f"Ignoring cuisine '{cuisine}' because it's set to Unknown or empty")

    logger.info(f"Restaurant search queries (in order): {search_queries}")

    # Function to check if image might be a flag (add basic URL and path checks)
    def might_be_flag(url):
        url_lower = url.lower()
        flag_indicators = ["flag", "iran", "iranian", "emblem", "national"]
        return any(indicator in url_lower for indicator in flag_indicators)

    # Try Pexels FIRST for restaurant images
    if PEXELS_API_KEY and pexels_limiter.can_make_request():
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

                # Record this request in the rate limiter
                pexels_limiter.add_request()

                response = requests.get(
                    pexels_url, headers=headers, params=params)
                remaining = response.headers.get('X-Ratelimit-Remaining')
                if remaining:
                    logger.info(
                        f"Pexels API reported {remaining} requests remaining")

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
                elif response.status_code == 429:  # Too many requests
                    logger.warning("Pexels API rate limit reached!")
                    # Mark the rate limiter as exhausted
                    while pexels_limiter.can_make_request():
                        pexels_limiter.add_request()
                    break  # Exit the Pexels loop and try Unsplash
                else:
                    logger.warning(
                        f"Pexels API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching restaurant image from Pexels with query '{query}': {str(e)}")

    # Try Unsplash with more specific queries to avoid flags
    if UNSPLASH_API_KEY and unsplash_limiter.can_make_request():
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

                # Record this request in the rate limiter
                unsplash_limiter.add_request()

                response = requests.get(
                    unsplash_url, headers=headers, params=params)
                remaining = response.headers.get('X-Ratelimit-Remaining')
                if remaining:
                    logger.info(
                        f"Unsplash API reported {remaining} requests remaining")

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
                elif response.status_code == 429:  # Too many requests
                    logger.warning("Unsplash API rate limit reached!")
                    # Mark the rate limiter as exhausted
                    while unsplash_limiter.can_make_request():
                        unsplash_limiter.add_request()
                    break  # Exit the Unsplash loop
                else:
                    logger.warning(
                        f"Unsplash API error: Status {response.status_code} - {response.text}")

            except Exception as e:
                logger.error(
                    f"Error fetching restaurant image from Unsplash with query '{query}': {str(e)}")

    # Instead of the direct fallback which might be causing the flag issue, use a generic restaurant image
    if pexels_limiter.get_remaining() == 0 and unsplash_limiter.get_remaining() == 0:
        logger.warning(
            "All API rate limits reached. Skipping direct fallback to prevent further rate limit issues.")
    else:
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
