import { Restaurant } from '../interfaces';
import externalRestaurantService from './ExternalRestaurantService';
import {API_BASE_URL} from "../config/environment";

// Types
export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
  lat?: number;    // backward compatibility
  lng?: number;    // backward compatibility
  limit?: number;  // maximum number of results
}

export interface LocationEnhancedRestaurant extends Restaurant {
  distance?: number; // in kilometers from user
  formattedDistance?: string; // formatted distance string
}

// Constants
const LOCATION_CACHE_KEY = 'user_location_data';
const RESTAURANTS_CACHE_KEY = 'restaurants_location_data';
const LOCATION_CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

class LocationService {
  /**
   * Get the user's current location using the browser's geolocation API
   */
  getCurrentLocation(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      // Check if we have cached location data first
      const cachedData = this.getCachedLocationData();
      if (cachedData && this.isLocationCacheValid(cachedData)) {
        return resolve(cachedData);
      }
      
      // If no valid cache, get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData: UserLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: Date.now()
            };
            
            // Cache the location data
            this.cacheLocationData(locationData);
            
            resolve(locationData);
          },
          (error) => {
            console.error('Error getting location:', error);
            reject(error);
          },
          { enableHighAccuracy: true }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser'));
      }
    });
  }
  
  /**
   * Cache the user's location data in localStorage
   */
  cacheLocationData(data: UserLocation): void {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
  }
  
  /**
   * Get cached location data from localStorage
   */
  getCachedLocationData(): UserLocation | null {
    const cachedData = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cachedData) return null;
    
    try {
      return JSON.parse(cachedData) as UserLocation;
    } catch (error) {
      console.error('Error parsing cached location data:', error);
      return null;
    }
  }
  
  /**
   * Check if the cached location data is still valid
   */
  isLocationCacheValid(data: UserLocation): boolean {
    const now = Date.now();
    return now - data.timestamp < LOCATION_CACHE_EXPIRY;
  }
  
  /**
   * Cache restaurant data with location information
   */
  cacheRestaurantsWithLocation(restaurants: LocationEnhancedRestaurant[]): void {
    localStorage.setItem(RESTAURANTS_CACHE_KEY, JSON.stringify({
      data: restaurants,
      timestamp: Date.now()
    }));
  }
  
  /**
   * Get cached restaurant location data
   */
  getCachedRestaurantsWithLocation(): LocationEnhancedRestaurant[] | null {
    const cachedData = localStorage.getItem(RESTAURANTS_CACHE_KEY);
    if (!cachedData) return null;
    
    try {
      const parsed = JSON.parse(cachedData);
      if (Date.now() - parsed.timestamp < LOCATION_CACHE_EXPIRY) {
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Error parsing cached restaurant data:', error);
      return null;
    }
  }
  
  /**
   * Find nearby restaurants based on user location
   * This will first check the cache, then fetch from API if needed
   */
  async findNearbyRestaurants(params: NearbySearchParams): Promise<LocationEnhancedRestaurant[]> {
    // Handle both lat/lng and latitude/longitude param formats
    const latitude = params.latitude || params.lat || 0;
    const longitude = params.longitude || params.lng || 0;
    const radius = params.radius || 5; // Default 5km radius
    
    // Check cache first
    const cachedRestaurants = this.getCachedRestaurantsWithLocation();
    if (cachedRestaurants) {
      console.log("Using cached restaurant data");
      // Recalculate distances based on current location
      return this.calculateDistancesForRestaurants(cachedRestaurants, { latitude, longitude, radius });
    }
    
    try {
      // Step 1: Get restaurants from the external API
      const externalRestaurants = await externalRestaurantService.fetchNearbyRestaurants(latitude, longitude, radius * 1000);
      console.log("Fetched external restaurants:", externalRestaurants.length);
      
      // Step 2: Get restaurants from our backend database
      const dbRestaurants = await this.fetchDatabaseRestaurants();
      console.log("Fetched database restaurants:", dbRestaurants.length);
      
      // Step 3: Check for duplicate restaurants (by name for simplicity)
      const knownRestaurantNames = new Set(dbRestaurants.map(r => r.name.toLowerCase()));
      const newRestaurants = externalRestaurants.filter(r => !knownRestaurantNames.has(r.name.toLowerCase()));
      console.log("New restaurants to save:", newRestaurants.length);
      
      // Step 4: Save new restaurants to the database
      const savedNewRestaurants = await externalRestaurantService.saveRestaurantsToDatabase(newRestaurants);
      
      // Step 5: Combine all restaurants
      let allRestaurants = [...dbRestaurants];
      
      // Add new restaurants with distances calculated
      savedNewRestaurants.forEach(newRestaurant => {
        if (!knownRestaurantNames.has(newRestaurant.name.toLowerCase())) {
          allRestaurants.push(newRestaurant);
        }
      });
      
      // Step 6: Calculate distances for all restaurants
      allRestaurants = this.calculateDistancesForRestaurants(allRestaurants, { latitude, longitude, radius });
      
      // Step 7: Cache the results
      this.cacheRestaurantsWithLocation(allRestaurants);
      
      return allRestaurants;
    } catch (error) {
      console.error('Error in findNearbyRestaurants:', error);
      
      // If external API fails, try to get restaurants from our backend
      try {
        const dbRestaurants = await this.fetchDatabaseRestaurants();
        const withDistances = this.calculateDistancesForRestaurants(dbRestaurants, { latitude, longitude, radius });
        this.cacheRestaurantsWithLocation(withDistances);
        return withDistances;
      } catch (dbError) {
        console.error('Error fetching database restaurants:', dbError);
        return [];
      }
    }
  }
  
  /**
   * Fetch restaurant data from our backend API
   */
  async fetchDatabaseRestaurants(): Promise<LocationEnhancedRestaurant[]> {
    try {
      // Get all restaurants from our API
      const response = await fetch(`${API_BASE_URL}/restaurants/`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants from database');
      }
      
      const restaurants = await response.json();
      return restaurants;
      
    } catch (error) {
      console.error('Error fetching database restaurants:', error);
      throw error;
    }
  }
  
  /**
   * Calculate distances for a list of restaurants based on user location
   */
  calculateDistancesForRestaurants(
    restaurants: LocationEnhancedRestaurant[], 
    params: NearbySearchParams
  ): LocationEnhancedRestaurant[] {
    const latitude = params.latitude || params.lat || 0;
    const longitude = params.longitude || params.lng || 0;
    const radius = params.radius || 10; // Default 10km radius
    
    return restaurants.map(restaurant => {
      if (restaurant.latitude && restaurant.longitude) {
        // Calculate distance if not already set
        if (restaurant.distance === undefined) {
          const distance = this.getHaversineDistance(
            latitude,
            longitude,
            restaurant.latitude,
            restaurant.longitude
          );
          
          const formattedDistance = distance < 1 
            ? `${Math.round(distance * 1000)} m` 
            : `${distance.toFixed(1)} km`;
            
          return { 
            ...restaurant, 
            distance,
            formattedDistance
          };
        }
        return restaurant;
      }
      return restaurant;
    })
    .filter(restaurant => {
      // Filter by radius if specified
      if (radius && restaurant.distance !== undefined) {
        return restaurant.distance <= radius;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    });
  }
  
  /**
   * Calculate distance between coordinates using the Haversine formula
   */
  getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Save a restaurant with its location to the backend
   */
  async saveRestaurantWithLocation(restaurantData: {
    name: string;
    foods_on_menu?: number;
    image?: string;
    imageIsLocal?: boolean;
    latitude: number;
    longitude: number;
  }): Promise<Restaurant> {
    try {
      // Extract image data to handle separately
      const { imageIsLocal, ...dataToSend } = restaurantData;
      
      // The backend doesn't need to know if the image is local
      // We can send just the relevant data
      const response = await fetch(`${API_BASE_URL}/restaurants/with-location/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save restaurant: ${errorText}`);
      }
      
      // Clear the restaurants cache to force a refresh on next fetch
      localStorage.removeItem(RESTAURANTS_CACHE_KEY);
      
      const savedData = await response.json();
      
      // Add back the imageIsLocal flag for the frontend
      return { ...savedData, imageIsLocal };
    } catch (error) {
      console.error('Error saving restaurant with location:', error);
      throw error;
    }
  }
  
  /**
   * Update a restaurant's location
   */
  async updateRestaurantLocation(
    restaurantId: number,
    latitude: number,
    longitude: number
  ): Promise<Restaurant> {
    try {
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/location/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update restaurant location');
      }
      
      // Clear the restaurants cache to force a refresh on next fetch
      localStorage.removeItem(RESTAURANTS_CACHE_KEY);
      
      return await response.json();
    } catch (error) {
      console.error('Error updating restaurant location:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
export default locationService;
