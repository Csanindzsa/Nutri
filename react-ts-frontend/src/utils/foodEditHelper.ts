import { Food, MacroTable } from "../interfaces";
import { API_BASE_URL, API_ENDPOINTS } from "../config/environment";

interface FoodUpdateData {
  name: string;
  restaurant: number | string;
  serving_size: number;
  ingredients: number[];
  is_organic: boolean;
  is_gluten_free: boolean;
  is_alcohol_free: boolean;
  is_lactose_free: boolean;
  macro_table: MacroTable;
  reason: string;
}

/**
 * Try different endpoints to update a food item
 */
export async function tryUpdateFood(
  foodId: string | undefined, 
  foodData: FoodUpdateData, 
  accessToken: string | null
): Promise<Food> {
  if (!foodId) {
    throw new Error("Food ID is required");
  }

  // List of possible endpoints to try (based on Django URL patterns from error)
  const endpoints = [
    // Most likely correct endpoints based on your Django URL patterns
    API_ENDPOINTS.proposeChange,                // Primary endpoint for proposing food changes
    `${API_BASE_URL}/foods/${foodId}/`,         // Standard REST endpoint with PATCH method
    
    // Try these as fallbacks
    `${API_BASE_URL}/foods/update/${foodId}/`,
    `${API_BASE_URL}/food-changes/${foodId}/`,
  ];
  
  let lastError: Error | null = null;
  
  // Try each endpoint until one works
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      
      // For the propose-change endpoint, include the food_id in the request body
      const requestBody = endpoint === API_ENDPOINTS.proposeChange
        ? { ...foodData, food_id: parseInt(foodId) } 
        : foodData;
      
      // Use PATCH method for /foods/<id>/ endpoint, POST for others
      const method = endpoint === `${API_BASE_URL}/foods/${foodId}/` ? 'PATCH' : 'POST';
      
      console.log(`Using ${method} method for ${endpoint}`);
      console.log('Request body:', requestBody);
      
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        console.log(`Success with endpoint: ${endpoint}`);
        return await response.json();
      }
      
      // If we got a response but not OK, save the error details
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        console.error(`JSON error from ${endpoint}:`, errorData);
        lastError = new Error(errorData.detail || `Error ${response.status} with endpoint ${endpoint}`);
      } else {
        const text = await response.text();
        console.error(`Text error from ${endpoint}:`, text);
        lastError = new Error(`Error ${response.status} with endpoint ${endpoint}: ${text.substring(0, 100)}...`);
      }
      
      console.error(`Failed with endpoint: ${endpoint}`, { status: response.status });
      
    } catch (err) {
      console.error(`Error with endpoint: ${endpoint}`, err);
      lastError = err as Error;
    }
  }
  
  // All endpoints failed
  throw lastError || new Error("Failed to update food with all known endpoints");
}
