/**
 * Application environment configuration
 * 
 * This file centralizes all environment-specific URLs and settings.
 * Edit these values to change API endpoints and frontend URLs.
 */

// Base URLs
export const API_BASE_URL = "${API_BASE_URL}";
export const FRONTEND_BASE_URL = "http://localhost:5173";

// API Endpoints - built using the base URL
export const API_ENDPOINTS = {
  // Authentication
  login: `${API_BASE_URL}/token/`,
  tokenVerify: `${API_BASE_URL}/token/verify/`,
  tokenRefresh: `${API_BASE_URL}/token/refresh/`,
  register: `${API_BASE_URL}/create-user/`,
  confirmEmail: `${API_BASE_URL}/confirm-email/`,
  
  // User management
  editUser: `${API_BASE_URL}/users/edit/`,
  deleteUser: `${API_BASE_URL}/users/delete/`,
  
  // Basic entities
  restaurants: `${API_BASE_URL}/restaurants/`,
  foods: `${API_BASE_URL}/foods/`,
  ingredients: `${API_BASE_URL}/ingredients/`,
  locations: `${API_BASE_URL}/locations/`,
  
  // Food operations
  createFood: `${API_BASE_URL}/foods/create/`,
  approvableFoods: `${API_BASE_URL}/foods/approvable/`,
  acceptFood: (foodId: number) => `${API_BASE_URL}/food/${foodId}/accept/`,
  proposeChange: `${API_BASE_URL}/food-changes/propose-change/`,
  proposeRemoval: (foodId: number) => `${API_BASE_URL}/food/${foodId}/propose-removal/`,
  
  // Food change approvals
  foodChangeUpdates: `${API_BASE_URL}/food-changes/updates/`,
  foodChangeDeletions: `${API_BASE_URL}/food-changes/deletions/`,
  approveChange: (changeId: number) => `${API_BASE_URL}/food-changes/${changeId}/approve-change/`,
  approveRemoval: (changeId: number) => `${API_BASE_URL}/food-changes/${changeId}/approve-removal/`,
  
  // Frontend URLs for redirects and email links
  frontendConfirmEmail: (token: string) => `${FRONTEND_BASE_URL}/confirm-email/${token}`,
};

/**
 * Helper function to update the API base URL at runtime
 * Useful for switching between environments
 */
export const updateApiBaseUrl = (newUrl: string) => {
  // This only updates the variable in memory for the current session
  (window as any).__API_BASE_URL = newUrl;
  
  // To actually use the updated URL, you would need to:
  // 1. Reload components that use these endpoints
  // 2. Or implement a more complex state management solution
  console.log(`API base URL updated to: ${newUrl}`);
};

/**
 * Helper function to get the current API base URL
 * Allows for runtime updates through updateApiBaseUrl
 */
export const getApiBaseUrl = () => {
  return (window as any).__API_BASE_URL || API_BASE_URL;
};
