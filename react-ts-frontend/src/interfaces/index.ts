// Add these properties to the Restaurant interface if they don't already exist

export interface Restaurant {
  id: number;
  name: string;
  location?: string;
  cuisine_type?: string;
  image?: string;
  average_rating?: number;
  latitude?: number;  // Add latitude for geolocation
  longitude?: number; // Add longitude for geolocation
  // ...other existing properties
}

// ...other existing interfaces
