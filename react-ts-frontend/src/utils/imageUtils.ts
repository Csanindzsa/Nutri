/**
 * Helper function to get the correct image path for a restaurant
 * This will return either:
 * - An absolute URL (if the image starts with http)
 * - A local asset path using dynamic import
 * - A default placeholder image
 */
export const getRestaurantImage = (imageValue: string | undefined, isLocalAsset?: boolean): string => {
  // If no image is provided, return the default placeholder
  if (!imageValue) {
    return 'https://via.placeholder.com/300x180?text=Restaurant';
  }

  // If the image is explicitly marked as local or doesn't start with http/https, treat as local asset
  if (isLocalAsset || (!imageValue.startsWith('http://') && !imageValue.startsWith('https://'))) {
    try {
      // First try to load from the assets/images directory
      return require(`../assets/images/${imageValue}`).default;
    } catch (err) {
      console.error(`Failed to load local image: ${imageValue}`, err);
      // Fallback to placeholder if the local asset doesn't exist
      return 'https://via.placeholder.com/300x180?text=Image+Not+Found';
    }
  }

  // Otherwise, return the image URL as is
  return imageValue;
};

/**
 * Default restaurant images that can be used when creating new restaurants
 */
export const defaultRestaurantImages = [
  'restaurant1.png',
  'restaurant2.png',
  'restaurant3.png',
  'restaurant4.png',
  'restaurant5.png',
];

/**
 * Get a random default restaurant image
 */
export const getRandomRestaurantImage = (): string => {
  const randomIndex = Math.floor(Math.random() * defaultRestaurantImages.length);
  return defaultRestaurantImages[randomIndex];
};
