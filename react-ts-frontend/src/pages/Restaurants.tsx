import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  InputAdornment,
  Chip,
  Rating,
  Button,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import StarIcon from "@mui/icons-material/Star";
import { Restaurant } from "../interfaces";
import locationService, {
  LocationEnhancedRestaurant,
} from "../services/LocationService";
import { getRestaurantImage } from "../utils/imageUtils";

interface RestaurantsPageProps {
  restaurants: Restaurant[];
}

// We're now using the enhanced restaurant type from our service
type EnhancedRestaurant = LocationEnhancedRestaurant;

const Restaurants: React.FC<RestaurantsPageProps> = ({ restaurants }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCuisineType, setSelectedCuisineType] = useState<string | null>(
    null
  );
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [enhancedRestaurants, setEnhancedRestaurants] = useState<
    EnhancedRestaurant[]
  >([]);
  const [sortOption, setSortOption] = useState<"distance" | "rating" | null>(
    null
  );
  const [isProcessingLocation, setIsProcessingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000); // Default 5km radius

  // Extract unique cuisine types
  const cuisineTypes = Array.from(
    new Set(restaurants.map((r) => r.cuisine_type).filter(Boolean))
  );

  // Haversine formula to calculate distance between two coordinates
  const getHaversineDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      console.log(
        `[Distance] Calculating between: (${lat1}, ${lon1}) and (${lat2}, ${lon2})`
      );

      const R = 6371; // Earth's radius in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in kilometers

      console.log(`[Distance] Result: ${distance.toFixed(2)} km`);
      return distance;
    },
    []
  );

  // Calculate distance from user to restaurant
  const calculateDistances = useCallback(
    (
      restaurants: EnhancedRestaurant[],
      location: { lat: number; lng: number }
    ) => {
      console.log(
        "[Distance] Starting distance calculation with location:",
        location
      );

      if (!location) {
        console.warn(
          "[Distance] No location provided for distance calculation"
        );
        return restaurants;
      }

      try {
        const updatedRestaurants = restaurants.map((restaurant) => {
          if (restaurant.latitude && restaurant.longitude) {
            const distance = getHaversineDistance(
              location.lat,
              location.lng,
              restaurant.latitude,
              restaurant.longitude
            );

            // Format the distance string
            const formattedDistance =
              distance < 1
                ? `${Math.round(distance * 1000)} m`
                : `${distance.toFixed(1)} km`;

            console.log(`[Distance] ${restaurant.name}: ${formattedDistance}`);

            return {
              ...restaurant,
              distance,
              formattedDistance,
            };
          }
          console.log(`[Distance] ${restaurant.name}: Missing coordinates`);
          return restaurant;
        });

        console.log(
          "[Distance] Distance calculation completed for",
          updatedRestaurants.length,
          "restaurants"
        );
        return updatedRestaurants;
      } catch (error) {
        console.error("[Distance] Error calculating distances:", error);
        return restaurants;
      }
    },
    [getHaversineDistance]
  );

  // Sort restaurants by option
  const sortRestaurantsByOption = useCallback(
    (restaurants: EnhancedRestaurant[], option: "distance" | "rating") => {
      console.log("[Sort] Sorting restaurants by", option);

      try {
        const sorted = [...restaurants].sort((a, b) => {
          if (option === "distance") {
            // Sort by distance (ascending)
            return (a.distance || Infinity) - (b.distance || Infinity);
          } else {
            // Sort by rating (descending)
            return (b.average_rating || 0) - (a.average_rating || 0);
          }
        });

        console.log("[Sort] Sorting completed");
        return sorted;
      } catch (error) {
        console.error("[Sort] Error sorting restaurants:", error);
        return restaurants;
      }
    },
    []
  );

  // Generate mock coordinates for restaurants that don't have them
  const generateMockCoordinates = useCallback(
    (restaurant: Restaurant, baseLocation: { lat: number; lng: number }) => {
      const randomLat = baseLocation.lat + (Math.random() - 0.5) * 0.05; // smaller range for more realistic distances
      const randomLng = baseLocation.lng + (Math.random() - 0.5) * 0.05;

      console.log(`[Mock] Generated coordinates for ${restaurant.name}:`, {
        lat: randomLat,
        lng: randomLng,
      });
      return { latitude: randomLat, longitude: randomLng };
    },
    []
  );

  // Function to prepare restaurant data with ratings and mock locations
  const prepareRestaurantsData = useCallback(
    (
      restaurantsData: Restaurant[],
      currentLocation: { lat: number; lng: number } | null
    ) => {
      console.log(
        "[Prepare] Preparing restaurant data with location:",
        currentLocation
      );

      // Use Budapest as default location if user location is not available
      const baseLocation = currentLocation || {
        lat: 47.497913,
        lng: 19.040236,
      };
      console.log("[Prepare] Using base location:", baseLocation);

      // Clone and enhance the restaurants
      const enhanced = restaurantsData.map((restaurant) => {
        // Start with the original restaurant data
        const enhancedRestaurant: EnhancedRestaurant = { ...restaurant };

        // Add a rating if not present (for demo purposes)
        if (!enhancedRestaurant.average_rating) {
          enhancedRestaurant.average_rating = Math.random() * 3 + 2; // Random rating between 2-5
        }

        // Add mock location if not present (for demo purposes)
        if (!enhancedRestaurant.latitude || !enhancedRestaurant.longitude) {
          const mockCoords = generateMockCoordinates(restaurant, baseLocation);
          enhancedRestaurant.latitude = mockCoords.latitude;
          enhancedRestaurant.longitude = mockCoords.longitude;
        }

        return enhancedRestaurant;
      });

      console.log(
        "[Prepare] Enhanced restaurant data:",
        enhanced.length,
        "restaurants"
      );

      // Calculate distances if location is available
      if (currentLocation) {
        console.log("[Prepare] Calculating distances with current location");
        const withDistances = calculateDistances(enhanced, currentLocation);

        // Sort by distance by default when location is available
        const sorted = sortRestaurantsByOption(withDistances, "distance");
        setSortOption("distance");
        return sorted;
      }

      return enhanced;
    },
    [calculateDistances, generateMockCoordinates, sortRestaurantsByOption]
  );

  // Function to fetch nearby restaurants from external API
  const fetchNearbyRestaurants = useCallback(
    async (location: { lat: number; lng: number }) => {
      setIsLoading(true);
      setApiError(null);

      try {
        console.log(
          "[Restaurants] Fetching nearby restaurants for location:",
          location
        );

        // Use our location service to get restaurants near the user
        const nearbyResults = await locationService.findNearbyRestaurants({
          lat: location.lat,
          lng: location.lng,
          radius: searchRadius,
          limit: 50, // Get up to 50 results
        });

        console.log(
          "[Restaurants] Found nearby restaurants:",
          nearbyResults.length
        );

        if (nearbyResults.length === 0) {
          // If no results from API, use the restaurants passed as props
          console.log(
            "[Restaurants] No API results, using prop restaurants with distance calculation"
          );
          const withDistances = calculateDistances(restaurants, location);
          setEnhancedRestaurants(withDistances);
        } else {
          setEnhancedRestaurants(nearbyResults);
        }

        // Update sort option to distance by default when we get location data
        setSortOption("distance");
      } catch (error) {
        console.error(
          "[Restaurants] Error fetching nearby restaurants:",
          error
        );
        setApiError(
          "Failed to fetch nearby restaurants. Using stored data instead."
        );

        // Fallback to using the restaurants from props with distance calculation
        const withDistances = calculateDistances(restaurants, location);
        setEnhancedRestaurants(withDistances);
      } finally {
        setIsLoading(false);
      }
    },
    [restaurants, searchRadius]
  );

  // Combine database restaurants with external API results
  const combineRestaurantData = useCallback(
    (apiRestaurants: EnhancedRestaurant[], dbRestaurants: Restaurant[]) => {
      // Create a map of existing restaurants by name for quick lookup
      const existingByName = new Map();
      apiRestaurants.forEach((r) =>
        existingByName.set(r.name.toLowerCase(), r)
      );

      // Add database restaurants that aren't already in the API results
      const combined = [...apiRestaurants];
      dbRestaurants.forEach((restaurant) => {
        if (!existingByName.has(restaurant.name.toLowerCase())) {
          combined.push(restaurant);
        }
      });

      return combined;
    },
    []
  );

  // Request location on component mount
  useEffect(() => {
    console.log("[Init] Component mounted");

    // Check if we've asked for location before
    const locationAsked = localStorage.getItem("locationAsked");
    console.log("[Init] Location previously asked:", locationAsked || "no");

    if (!locationAsked) {
      console.log("[Init] Showing location dialog");
      setLocationDialog(true);
    } else {
      // Try to use saved location
      const savedLat = localStorage.getItem("userLat");
      const savedLng = localStorage.getItem("userLng");
      console.log("[Init] Saved location:", { savedLat, savedLng });

      if (savedLat && savedLng) {
        const savedLocation = {
          lat: parseFloat(savedLat),
          lng: parseFloat(savedLng),
        };
        console.log(
          "[Init] Setting user location from storage:",
          savedLocation
        );
        setUserLocation(savedLocation);

        // Initial preparation with saved location
        const prepared = prepareRestaurantsData(restaurants, savedLocation);
        setEnhancedRestaurants(prepared);
      } else {
        // Initial preparation without location
        console.log("[Init] No saved location, preparing without distances");
        const prepared = prepareRestaurantsData(restaurants, null);
        setEnhancedRestaurants(prepared);
      }
    }

    // Initialize with stored restaurant data while waiting for API
    setEnhancedRestaurants(restaurants.map((r) => ({ ...r })));
  }, [restaurants, prepareRestaurantsData]);

  // Update distances when user location changes
  useEffect(() => {
    console.log("[Location Effect] User location updated:", userLocation);

    if (
      userLocation &&
      enhancedRestaurants.length > 0 &&
      !isProcessingLocation
    ) {
      setIsProcessingLocation(true);
      console.log(
        "[Location Effect] Recalculating distances with new location"
      );

      try {
        const updatedWithDistances = calculateDistances(
          enhancedRestaurants,
          userLocation
        );
        const sorted = sortRestaurantsByOption(
          updatedWithDistances,
          "distance"
        );

        console.log(
          "[Location Effect] Setting updated restaurants with distances"
        );
        setEnhancedRestaurants(sorted);
        setSortOption("distance");
      } catch (error) {
        console.error("[Location Effect] Error updating distances:", error);
      } finally {
        setIsProcessingLocation(false);
      }
    }
  }, [
    userLocation,
    enhancedRestaurants.length,
    calculateDistances,
    sortRestaurantsByOption,
    isProcessingLocation,
  ]);

  // Effect to fetch nearby restaurants when user location changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyRestaurants(userLocation);
    }
  }, [userLocation, fetchNearbyRestaurants]);

  // Handle location request
  const handleRequestLocation = useCallback(() => {
    console.log("[Location Request] Starting...");
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      console.error("[Location Request] Geolocation not supported");
      setLocationError("Geolocation is not supported by your browser");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log("[Location Request] Obtained coordinates:", newLocation);

        // Save to localStorage
        localStorage.setItem("locationAsked", "true");
        localStorage.setItem("userLat", newLocation.lat.toString());
        localStorage.setItem("userLng", newLocation.lng.toString());
        console.log("[Location Request] Saved to localStorage");

        // Process the new location
        setUserLocation(newLocation);

        // Force immediate recalculation
        console.log("[Location Request] Forcing immediate recalculation");
        const recalculated = calculateDistances(
          enhancedRestaurants,
          newLocation
        );
        const sorted = sortRestaurantsByOption(recalculated, "distance");
        setEnhancedRestaurants(sorted);
        setSortOption("distance");

        setLocationLoading(false);
        setLocationDialog(false);

        setNotification({
          message: "Location successfully obtained",
          type: "success",
        });
      },
      (error) => {
        console.error("[Location Request] Error:", error.message);
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);

        // Mark as asked even if denied
        localStorage.setItem("locationAsked", "true");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [enhancedRestaurants, calculateDistances, sortRestaurantsByOption]);

  // Handle restaurant click
  const handleRestaurantClick = (restaurantId: number) => {
    navigate(`/foods?restaurant=${restaurantId}`);
  };

  // Handle cuisine filter
  const handleCuisineFilter = (cuisine: string) => {
    setSelectedCuisineType(selectedCuisineType === cuisine ? null : cuisine);
  };

  // Sort restaurants by distance or rating - wrapper for the UI
  const sortRestaurants = (option: "distance" | "rating") => {
    console.log("[Sort UI] Sorting by", option);
    setSortOption(option);

    const sorted = sortRestaurantsByOption(enhancedRestaurants, option);
    setEnhancedRestaurants(sorted);
  };

  // Filter restaurants
  const filteredRestaurants = enhancedRestaurants.filter((restaurant) => {
    const matchesSearch = restaurant.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCuisine =
      !selectedCuisineType || restaurant.cuisine_type === selectedCuisineType;
    return matchesSearch && matchesCuisine;
  });

  // Debug log for monitoring
  useEffect(() => {
    const restaurantsWithDistance = enhancedRestaurants.filter(
      (r) => r.distance !== undefined
    ).length;
    console.log(
      `[Debug] Restaurants with distance: ${restaurantsWithDistance}/${enhancedRestaurants.length}`
    );

    if (
      userLocation &&
      restaurantsWithDistance === 0 &&
      enhancedRestaurants.length > 0
    ) {
      console.warn("[Debug] Location available but no distances calculated!");
    }
  }, [enhancedRestaurants, userLocation]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header Section */}
      <Box
        sx={{
          backgroundColor: "#FF8C00",
          py: 3,
          px: 4,
          borderRadius: "10px 10px 0 0",
          mb: 0,
          color: "white",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Restaurants Near You
        </Typography>
        <Typography variant="subtitle1">
          Discover restaurants that offer foods matching your dietary
          preferences
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Box
        sx={{
          p: 3,
          backgroundColor: "white",
          borderBottom: "1px solid #eaeaea",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              placeholder="Search restaurants..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={8}>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                Filter by Cuisine:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {cuisineTypes.map((cuisine) => (
                  <Chip
                    key={cuisine}
                    label={cuisine}
                    clickable
                    color={
                      selectedCuisineType === cuisine ? "primary" : "default"
                    }
                    onClick={() => handleCuisineFilter(cuisine)}
                    icon={<RestaurantIcon />}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Box
              sx={{ display: "flex", flexDirection: "column", height: "100%" }}
            >
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 500 }}
              >
                My Location:
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={() => setLocationDialog(true)}
                  sx={{ mr: 1 }}
                >
                  {userLocation ? "Update Location" : "Get Location"}
                </Button>

                {userLocation && (
                  <Typography variant="body2" color="text.secondary">
                    Location active
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: "auto" }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: 500 }}
                >
                  Sort by:
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant={
                      sortOption === "distance" ? "contained" : "outlined"
                    }
                    size="small"
                    onClick={() => sortRestaurants("distance")}
                    startIcon={<LocationOnIcon />}
                    disabled={!userLocation}
                    sx={{
                      bgcolor:
                        sortOption === "distance" ? "#FF8C00" : "inherit",
                      "&:hover": {
                        bgcolor: sortOption === "distance" ? "#e67e00" : "",
                      },
                    }}
                  >
                    Distance
                  </Button>
                  <Button
                    variant={sortOption === "rating" ? "contained" : "outlined"}
                    size="small"
                    onClick={() => sortRestaurants("rating")}
                    startIcon={<StarIcon />}
                    sx={{
                      bgcolor: sortOption === "rating" ? "#FF8C00" : "inherit",
                      "&:hover": {
                        bgcolor: sortOption === "rating" ? "#e67e00" : "",
                      },
                    }}
                  >
                    Rating
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Add loading indicator when fetching nearby restaurants */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={30} sx={{ color: "#FF8C00" }} />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Finding nearby restaurants...
            </Typography>
          </Box>
        )}

        {/* Show API error if any */}
        {apiError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {apiError}
          </Alert>
        )}
      </Box>

      {/* Results Section */}
      <Box
        sx={{
          p: 3,
          backgroundColor: "white",
          borderRadius: "0 0 10px 10px",
        }}
      >
        <Typography variant="h6" sx={{ mb: 3 }}>
          {filteredRestaurants.length} Restaurants Found
        </Typography>

        <Grid container spacing={3}>
          {filteredRestaurants.map((restaurant) => (
            <Grid item xs={12} sm={6} md={4} key={restaurant.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleRestaurantClick(restaurant.id)}
              >
                <CardMedia
                  component="img"
                  height="180"
                  image={getRestaurantImage(
                    restaurant.image,
                    restaurant.imageIsLocal
                  )}
                  alt={restaurant.name}
                />
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {restaurant.name}
                  </Typography>

                  {restaurant.cuisine_type && (
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <RestaurantIcon
                        sx={{ color: "text.secondary", mr: 1, fontSize: 18 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {restaurant.cuisine_type}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <LocationOnIcon
                      sx={{ color: "text.secondary", mr: 1, fontSize: 18 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {restaurant.formattedDistance
                        ? `${restaurant.formattedDistance} away`
                        : restaurant.location ||
                          "Location information not available"}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        backgroundColor: "#FF8C00",
                        "&:hover": { backgroundColor: "#e67e00" },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestaurantClick(restaurant.id);
                      }}
                    >
                      View Foods
                    </Button>

                    <Tooltip
                      title={`${
                        restaurant.average_rating?.toFixed(1) || 0
                      }/5 rating`}
                    >
                      <Box>
                        <Rating
                          value={restaurant.average_rating || 0}
                          readOnly
                          size="small"
                          precision={0.5}
                        />
                      </Box>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {filteredRestaurants.length === 0 && (
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                py: 8,
                px: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No restaurants match your search criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Try adjusting your search term or filters
              </Typography>
            </Box>
          )}
        </Grid>
      </Box>

      {/* Location Permission Dialog */}
      <Dialog
        open={locationDialog}
        onClose={() => setLocationDialog(false)}
        aria-labelledby="location-dialog-title"
      >
        <DialogTitle id="location-dialog-title">
          Share Your Location
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Allow Nutri to access your location to find restaurants near you.
            This helps us calculate distances and provide more relevant
            recommendations.
          </DialogContentText>
          {locationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {locationError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>Not Now</Button>
          <Button
            onClick={handleRequestLocation}
            variant="contained"
            color="primary"
            disabled={locationLoading}
            startIcon={
              locationLoading ? (
                <CircularProgress size={20} />
              ) : (
                <MyLocationIcon />
              )
            }
          >
            {locationLoading ? "Getting Location..." : "Share Location"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {notification && (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.type}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>

      {/* Display debug info in development mode */}
      {process.env.NODE_ENV !== "production" && userLocation && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: "1px dashed rgba(0,0,0,0.1)",
            borderRadius: 1,
            display: "none",
          }}
        >
          <Typography variant="subtitle2">Debug:</Typography>
          <Typography variant="caption" component="pre">
            Location: {JSON.stringify(userLocation, null, 2)}
            <br />
            Restaurants with distance:{" "}
            {enhancedRestaurants.filter((r) => r.distance !== undefined).length}
            /{enhancedRestaurants.length}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Restaurants;
