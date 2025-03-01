import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import { Restaurant } from "../interfaces";
import { locationService } from "../services/LocationService";
import {
  getRestaurantImage,
  defaultRestaurantImages,
  getRandomRestaurantImage,
} from "../utils/imageUtils";

interface RestaurantFormProps {
  initialData?: Restaurant;
  onSave: (restaurant: Restaurant) => void;
  onCancel: () => void;
}

const RestaurantForm: React.FC<RestaurantFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  // Form state
  const [name, setName] = useState(initialData?.name || "");
  const [foodsOnMenu, setFoodsOnMenu] = useState(
    initialData?.foods_on_menu || 0
  );
  const [image, setImage] = useState(initialData?.image || "");
  const [imageIsLocal, setImageIsLocal] = useState(
    initialData?.imageIsLocal || false
  );
  const [useLocalImage, setUseLocalImage] = useState(
    initialData?.imageIsLocal || false
  );
  const [latitude, setLatitude] = useState(initialData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialData?.longitude || 0);
  const [useCurrentLocation, setUseCurrentLocation] = useState(!initialData);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Set a random default local image if no image is provided
  useEffect(() => {
    if (!image && useLocalImage) {
      setImage(getRandomRestaurantImage());
    }
  }, [image, useLocalImage]);

  // Get current location when checkbox is checked
  useEffect(() => {
    if (useCurrentLocation) {
      setLocationLoading(true);
      locationService
        .getCurrentLocation()
        .then((location) => {
          setLatitude(location.latitude);
          setLongitude(location.longitude);
          setLocationLoading(false);
        })
        .catch((err) => {
          console.error("Error getting location:", err);
          setError(
            "Failed to get your location. Please enable location services."
          );
          setUseCurrentLocation(false);
          setLocationLoading(false);
        });
    }
  }, [useCurrentLocation]);

  // Handle toggling between local and external images
  const handleImageTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const useLocal = event.target.checked;
    setUseLocalImage(useLocal);

    if (useLocal) {
      // Set to a random image from the default set
      setImage(getRandomRestaurantImage());
      setImageIsLocal(true);
    } else {
      // Clear the image when switching back to URL input
      setImage("");
      setImageIsLocal(false);
    }
  };

  // Handle selecting a specific local image
  const handleLocalImageChange = (event: SelectChangeEvent<string>) => {
    setImage(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      setError("Restaurant name is required");
      return;
    }

    if (!latitude || !longitude) {
      setError("Location coordinates are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let savedRestaurant;

      const restaurantData = {
        name,
        foods_on_menu: foodsOnMenu,
        image: image || undefined,
        imageIsLocal: useLocalImage,
        latitude,
        longitude,
      };

      if (initialData?.id) {
        // Update existing restaurant
        savedRestaurant = await locationService.updateRestaurantLocation(
          initialData.id,
          latitude,
          longitude
        );
      } else {
        // Create new restaurant
        savedRestaurant = await locationService.saveRestaurantWithLocation(
          restaurantData
        );
      }

      onSave(savedRestaurant);
    } catch (err: any) {
      setError(err.message || "Failed to save restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        {initialData ? "Edit Restaurant" : "Add New Restaurant"}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Restaurant Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Foods on Menu"
              type="number"
              fullWidth
              value={foodsOnMenu}
              onChange={(e) =>
                setFoodsOnMenu(parseInt(e.target.value, 10) || 0)
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useLocalImage}
                  onChange={handleImageTypeChange}
                />
              }
              label="Use local image"
            />
          </Grid>

          <Grid item xs={12}>
            {useLocalImage ? (
              <FormControl fullWidth>
                <InputLabel>Restaurant Image</InputLabel>
                <Select
                  value={image}
                  onChange={handleLocalImageChange}
                  label="Restaurant Image"
                >
                  {defaultRestaurantImages.map((img) => (
                    <MenuItem key={img} value={img}>
                      {img.replace(".png", "").replace(".jpg", "")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                label="Image URL"
                fullWidth
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            )}
          </Grid>

          {/* Preview of the selected image */}
          {image && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Image Preview
                </Typography>
                <Box
                  component="img"
                  src={getRestaurantImage(image, useLocalImage)}
                  alt="Preview"
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "150px",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={useCurrentLocation}
                  onChange={(e) => setUseCurrentLocation(e.target.checked)}
                />
              }
              label="Use my current location"
            />
          </Grid>

          {locationLoading ? (
            <Grid item xs={12}>
              <Box display="flex" alignItems="center">
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Getting your location...
                </Typography>
              </Box>
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Latitude"
                  type="number"
                  fullWidth
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  inputProps={{ step: "any" }}
                  disabled={useCurrentLocation}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Longitude"
                  type="number"
                  fullWidth
                  required
                  value={longitude}
                  onChange={(e) =>
                    setLongitude(parseFloat(e.target.value) || 0)
                  }
                  inputProps={{ step: "any" }}
                  disabled={useCurrentLocation}
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {initialData ? "Update" : "Add"} Restaurant
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default RestaurantForm;
