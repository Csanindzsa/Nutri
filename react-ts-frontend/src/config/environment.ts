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
  // Auth endpoints
  token: `${API_BASE_URL}/token/`,
  tokenRefresh: `${API_BASE_URL}/token/refresh/`,
  tokenVerify: `${API_BASE_URL}/token/verify/`,
  
  // User endpoints
  createUser: `${API_BASE_URL}/create-user/`,
  confirmEmail: `${API_BASE_URL}/confirm-email/`,
  editUser: `${API_BASE_URL}/users/edit/`,
  deleteUser: `${API_BASE_URL}/users/delete/`,
  
  // Data endpoints
  restaurants: `${API_BASE_URL}/restaurants/`,
  locations: `${API_BASE_URL}/locations/`,
  foods: `${API_BASE_URL}/foods/`,
  foodCreate: `${API_BASE_URL}/foods/create/`,
  ingredients: `${API_BASE_URL}/ingredients/`,
  
  // Food approval endpoints
  acceptFood: (id: string | number) => `${API_BASE_URL}/food/${id}/accept/`,
  approvableFoods: `${API_BASE_URL}/foods/approvable/`,
  
  // Food change endpoints
  proposeChange: `${API_BASE_URL}/food-changes/propose-change/`,
  foodChanges: `${API_BASE_URL}/food-changes/`,
  foodChangeUpdates: `${API_BASE_URL}/food-changes/updates/`,
  approveChange: (id: string | number) => `${API_BASE_URL}/food-changes/${id}/approve-change/`,
  proposeRemoval: (id: string | number) => `${API_BASE_URL}/food/${id}/propose-removal/`,
  foodChangeDeletions: `${API_BASE_URL}/food-changes/deletions/`,
  approveRemoval: (id: string | number) => `${API_BASE_URL}/food-changes/${id}/approve-removal/`,
  
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
