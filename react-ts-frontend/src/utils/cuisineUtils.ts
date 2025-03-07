/**
 * Utility functions for formatting and grouping cuisine types
 */

/**
 * Format a cuisine name for display by converting from snake_case to Title Case
 * and handles semicolon-separated values
 */
export const formatCuisineName = (cuisine: string): string => {
  // Replace underscores with spaces and capitalize each word
  return cuisine
    .split(/[_\s;]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Group similar cuisines into more general categories
 */
export const normalizeCuisine = (cuisine: string): string => {
  // Remove any part after semicolon for filtering
  const primaryCuisine = cuisine.split(';')[0].toLowerCase();
  
  // Map of cuisine categories
  const cuisineMap: {[key: string]: string} = {
    'pizza': 'Pizza',
    'italian': 'Italian',
    'italian_pizza': 'Italian',
    'pizza_italian': 'Italian',
    'burger': 'Burgers',
    'hamburger': 'Burgers',
    'kebab': 'Middle Eastern',
    'turkish': 'Middle Eastern',
    'middle_eastern': 'Middle Eastern',
    'chicken': 'Chicken',
    'wings': 'Chicken',
    'coffee_shop': 'Café',
    'cafe': 'Café',
    'asian': 'Asian',
    'chinese': 'Asian',
    'thai': 'Asian',
    'japanese': 'Asian',
    'sushi': 'Asian',
    'regional': 'Regional',
    'fast_food': 'Fast Food',
    'sandwich': 'Sandwiches & Bakery',
    'bakery': 'Sandwiches & Bakery',
    'cake': 'Desserts',
    'ice_cream': 'Desserts',
    'dessert': 'Desserts',
  };
  
  return cuisineMap[primaryCuisine] || formatCuisineName(primaryCuisine);
};

/**
 * Process multiple cuisine types separated by semicolons
 */
export const formatMultipleCuisines = (cuisines: string): string => {
  if (!cuisines) return 'Unknown';
  
  return cuisines
    .split(';')
    .map(cuisine => normalizeCuisine(cuisine))
    .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
    .join(', ');
};
