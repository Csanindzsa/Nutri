import { API_BASE_URL } from "../config/environment";
import { Restaurant } from "../interfaces";

// Extended restaurant type with location information
export interface LocationEnhancedRestaurant extends Restaurant {
  distance?: number;
  formattedDistance?: string;
  fromDatabase?: boolean; // Add this property
  osmId?: number; // Also explicitly define this property that's used in the code
}

// Define OpenStreetMap response interface
interface OSMRestaurant {
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    cuisine?: string;
    amenity?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
    "addr:postcode"?: string;
    [key: string]: string | undefined;
  };
  type: string;
}

interface NearbyRestaurantsRequest {
  latitude: number;
  longitude: number;
  radius: number;
  limit?: number;
}

class LocationService {
  /**
   * Finds nearby restaurants using OpenStreetMap API and saves them to our database
   */
  async findNearbyRestaurants(params: NearbyRestaurantsRequest): Promise<LocationEnhancedRestaurant[]> {
    try {
      console.log("[LocationService] Finding nearby restaurants with params:", params);
      
      // Use Overpass API to find restaurants near the location
      // This uses the Overpass Query Language (QL) to find amenities of type "restaurant" within radius
      const radius = params.radius || 5000; // Default to 5000m if not specified
      const limit = params.limit || 50;
      
      // Build the Overpass QL query
      const overpassQuery = `
        [out:json];
        (
          node["amenity"="restaurant"](around:${radius},${params.latitude},${params.longitude});
          node["amenity"="cafe"](around:${radius},${params.latitude},${params.longitude});
          node["amenity"="fast_food"](around:${radius},${params.latitude},${params.longitude});
          node["amenity"="pub"]["food"="yes"](around:${radius},${params.latitude},${params.longitude});
        );
        out body ${limit};
      `;
      
      console.log("[LocationService] Sending Overpass query:", overpassQuery);
      
      // Make request to Overpass API
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Overpass API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data.elements) || data.elements.length === 0) {
        console.warn("[LocationService] No restaurants found in the area");
        return [];
      }
      
      console.log(`[LocationService] Found ${data.elements.length} places from OpenStreetMap`);
      
      // Transform OSM data into our application's restaurant format
      const nearbyRestaurants = data.elements
        .filter((element: any) => element.type === "node" && element.tags && element.tags.name)
        .map((place: OSMRestaurant) => {
          // Extract address components
          const street = place.tags["addr:street"] || "";
          const housenumber = place.tags["addr:housenumber"] || "";
          const city = place.tags["addr:city"] || "";
          const postcode = place.tags["addr:postcode"] || "";
          
          // Combine address components
          const location = [
            housenumber ? `${housenumber} ${street}` : street,
            city,
            postcode
          ].filter(Boolean).join(", ");
          
          // Calculate distance
          const distance = this.calculateDistance(
            params.latitude,
            params.longitude,
            place.lat,
            place.lon
          );
          
          // Determine cuisine type from OSM tags
          const cuisine = place.tags.cuisine || this.getCuisineFromAmenity(place.tags.amenity || "");
          
          return {
            id: this.generateTempId(),
            name: place.tags.name || "Unknown Restaurant",
            cuisine: cuisine || "Unknown",
            location: location || `Near (${place.lat.toFixed(4)}, ${place.lon.toFixed(4)})`,
            latitude: place.lat,
            longitude: place.lon,
            foods_on_menu: 0,
            distance,
            // Store OSM ID for potential future reference
            osmId: place.id
          } as LocationEnhancedRestaurant;
        });
      
      console.log(`[LocationService] Processed ${nearbyRestaurants.length} restaurants from OSM data`);
      
      // Format distances for display
      const enhancedRestaurants = nearbyRestaurants.map((restaurant: LocationEnhancedRestaurant) => {
        if (restaurant.distance !== undefined) {
          restaurant.formattedDistance = 
            restaurant.distance < 1
              ? `${Math.round(restaurant.distance * 1000)} m`
              : `${restaurant.distance.toFixed(1)} km`;
        }
        return restaurant;
      });
      
      // Sort by distance
      enhancedRestaurants.sort((a: LocationEnhancedRestaurant, b: LocationEnhancedRestaurant) => {
        return (a.distance || Infinity) - (b.distance || Infinity);
      });
      
      // Save the restaurants to our database and get updated records
      try {
        console.log(`[LocationService] Sending ${enhancedRestaurants.length} restaurants to database...`);
        
        const saveResponse = await fetch(`${API_BASE_URL}/restaurants/batch-save/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enhancedRestaurants)
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          console.log("[LocationService] Save response:", saveData);
          
          // Replace temporary IDs with real database IDs where applicable
          if (saveData.saved_restaurants && saveData.saved_restaurants.length > 0) {
            // Map from name to database ID for quick lookups
            const restaurantIdMap = new Map();
            saveData.saved_restaurants.forEach((r: any) => {
              restaurantIdMap.set(r.name.toLowerCase(), r.id);
            });
            
            // Replace our temp IDs with real database IDs for matched restaurants
            enhancedRestaurants.forEach((restaurant: LocationEnhancedRestaurant) => {
              const dbId = restaurantIdMap.get(restaurant.name.toLowerCase());
              if (dbId) {
                restaurant.id = dbId;  // Replace temp ID with real DB ID
                restaurant.fromDatabase = true;  // Mark as being in the database
              }
            });
            
            console.log(`[LocationService] Updated ${restaurantIdMap.size} restaurants with database IDs`);
          }
        } else {
          console.error("[LocationService] Error saving restaurants:", saveResponse.statusText);
        }
      } catch (saveError) {
        console.error("[LocationService] Error saving restaurants to database:", saveError);
      }
      
      return enhancedRestaurants;
    } catch (error) {
      console.error("[LocationService] Error fetching nearby restaurants:", error);
      return [];
    }
  }
  
  /**
   * Infer cuisine type from amenity type when cuisine tag is not available
   */
  private getCuisineFromAmenity(amenity: string): string {
    switch(amenity) {
      case "fast_food": return "Fast Food";
      case "cafe": return "Café";
      case "pub": return "Pub Food";
      default: return "";
    }
  }
  
  /**
   * Generate a temporary ID for new restaurants
   */
  private generateTempId(): number {
    // Generate a negative ID to avoid conflicts with database IDs
    return -Math.floor(Math.random() * 1000000);
  }
  
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2?: number, lon2?: number): number | undefined {
    if (!lat2 || !lon2) return undefined;
    
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export default new LocationService();
