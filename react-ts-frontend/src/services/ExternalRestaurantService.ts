import { Restaurant } from '../interfaces';
import locationService from './LocationService';

// This API key should be stored in an environment variable in a real app
// const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
// For this example, we'll use a mocked API response to avoid API key requirements

interface NearbyRestaurantsResponse {
  results: any[];
  status: string;
}

class ExternalRestaurantService {
  private backendUrl = 'http://localhost:8000';

  /**
   * Fetch nearby restaurants from Google Places API or similar
   * For demo purposes, we're using a mocked response, but in production this would call the actual API
   */
  async fetchNearbyRestaurants(latitude: number, longitude: number, radius: number = 1500): Promise<Restaurant[]> {
    console.log(`[ExternalRestaurantService] Fetching nearby restaurants at ${latitude}, ${longitude}`);
    
    try {
      // In a real implementation, this would make an API call to Google Places API
      // const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=restaurant&key=${GOOGLE_MAPS_API_KEY}`;
      
      // For demo purposes, we'll use mock data to avoid requiring API keys
      const mockData = await this.getMockRestaurantData(latitude, longitude);
      
      // Transform the restaurant data to match our interface
      const restaurants: Restaurant[] = mockData.results.map(place => ({
        id: -1, // We'll use -1 as a temporary ID for unsaved restaurants
        name: place.name,
        foods_on_menu: 0, // Default until we know better
        image: place.photo || "https://via.placeholder.com/150?text=Restaurant",
        cuisine_type: place.types?.includes('bakery') ? 'Bakery' : 
                     place.types?.includes('cafe') ? 'Café' : 
                     place.types?.includes('bar') ? 'Bar' : 'Restaurant',
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        // Add distance
        distance: this.calculateDistance(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        ),
        // Format the distance for display
        formattedDistance: this.formatDistance(this.calculateDistance(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        ))
      }));
      
      return restaurants;
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      return [];
    }
  }
  
  /**
   * Save multiple restaurants to the database
   */
  async saveRestaurantsToDatabase(restaurants: Restaurant[]): Promise<Restaurant[]> {
    console.log(`[ExternalRestaurantService] Saving ${restaurants.length} restaurants to database`);
    
    const savedRestaurants: Restaurant[] = [];
    
    for (const restaurant of restaurants) {
      try {
        // We only want to save restaurants that don't have an ID yet (haven't been saved)
        if (restaurant.id === -1) {
          const saved = await this.saveRestaurantToDatabase(restaurant);
          savedRestaurants.push(saved);
        } else {
          savedRestaurants.push(restaurant);
        }
      } catch (error) {
        console.error(`Error saving restaurant ${restaurant.name}:`, error);
      }
    }
    
    return savedRestaurants;
  }
  
  /**
   * Save a single restaurant to the database
   */
  async saveRestaurantToDatabase(restaurant: Restaurant): Promise<Restaurant> {
    try {
      // Use the locationService to save the restaurant
      const savedRestaurant = await locationService.saveRestaurantWithLocation({
        name: restaurant.name,
        foods_on_menu: restaurant.foods_on_menu || 0,
        image: restaurant.image,
        latitude: restaurant.latitude!,
        longitude: restaurant.longitude!,
      });
      
      // Return the saved restaurant with the original distance information
      return {
        ...savedRestaurant,
        distance: restaurant.distance,
        formattedDistance: restaurant.formattedDistance,
        cuisine_type: restaurant.cuisine_type
      };
    } catch (error) {
      console.error(`Error saving restaurant ${restaurant.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Calculate distance between two coordinates using the Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
  
  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }
  
  /**
   * Mock data for restaurants nearby - this simulates a Google Places API response
   */
  async getMockRestaurantData(latitude: number, longitude: number): Promise<NearbyRestaurantsResponse> {
    // Generate 10 restaurants at random positions near the given coordinates
    const results = Array.from({ length: 10 }).map((_, index) => {
      // Generate random offsets for lat/lng to create nearby locations
      const latOffset = (Math.random() - 0.5) * 0.02; // About 1-2 km
      const lngOffset = (Math.random() - 0.5) * 0.02;
      
      // Restaurant types for variety
      const types = [
        ['restaurant', 'food'],
        ['cafe', 'restaurant'],
        ['bakery', 'food'],
        ['bar', 'restaurant'],
        ['meal_delivery', 'restaurant']
      ];
      
      return {
        place_id: `place_${index}`,
        name: `Restaurant ${index + 1}`,
        vicinity: `Street ${index + 1}, City`,
        rating: 3 + Math.random() * 2, // Rating between 3 and 5
        types: types[index % types.length],
        photo: null, // No real photos in mock data
        geometry: {
          location: {
            lat: latitude + latOffset,
            lng: longitude + lngOffset
          }
        },
        opening_hours: {
          open_now: Math.random() > 0.3 // 70% chance of being open
        }
      };
    });
    
    return {
      results,
      status: "OK"
    };
  }
}

export const externalRestaurantService = new ExternalRestaurantService();
export default externalRestaurantService;
