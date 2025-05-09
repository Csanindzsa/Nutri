import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Restaurant, Ingredient, Food, MacroTable } from "../interfaces";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { tryUpdateFood } from "../utils/foodEditHelper";
import { API_ENDPOINTS } from "../config/environment";

// Update the EditFoodProps interface to accept user data
interface EditFoodProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  onUpdateFood: (food: Food) => void;
  userData?: { email?: string; username?: string; user_id?: number }; // Add userData prop
  setNotificationMessage?: (message: {
    text: string;
    type: "success" | "error" | "info" | "warning";
  }) => void;
}

const EditFood: React.FC<EditFoodProps> = ({
  accessToken,
  restaurants,
  ingredients,
  onUpdateFood,
  userData, // Include userData in the props
  setNotificationMessage,
}) => {
  const { foodId } = useParams<{ foodId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState<boolean>(false);

  // Form state
  const [name, setName] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<number | "">("");
  const [servingSize, setServingSize] = useState<number>(0);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [isOrganic, setIsOrganic] = useState<boolean>(false);
  const [isGlutenFree, setIsGlutenFree] = useState<boolean>(false);
  const [isAlcoholFree, setIsAlcoholFree] = useState<boolean>(false);
  const [isLactoseFree, setIsLactoseFree] = useState<boolean>(false);
  const [macroTable, setMacroTable] = useState<MacroTable>({
    energy_kcal: 0,
    fat: 0,
    saturated_fat: 0,
    carbohydrates: 0,
    sugars: 0,
    fiber: 0,
    protein: 0,
    salt: 0,
  });

  // Add a state to store reason for update
  const [reason, setReason] = useState<string>("");

  // Fetch the food data
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { state: { from: `/food/${foodId}/edit` } });
      return;
    }

    const fetchFood = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_ENDPOINTS.foods}${foodId}/`);

        if (!response.ok) {
          throw new Error(`Failed to fetch food: ${response.statusText}`);
        }

        const foodData = await response.json();

        // Populate form fields with food data
        setName(foodData.name);
        setRestaurantId(foodData.restaurant);
        setServingSize(foodData.serving_size);
        setSelectedIngredients(foodData.ingredients || []);
        setIsOrganic(foodData.is_organic);
        setIsGlutenFree(foodData.is_gluten_free);
        setIsAlcoholFree(foodData.is_alcohol_free);
        setIsLactoseFree(foodData.is_lactose_free);

        if (foodData.macro_table) {
          setMacroTable(foodData.macro_table);
        }
      } catch (err) {
        console.error("Error fetching food:", err);
        setError("Failed to load food data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFood();
  }, [foodId, accessToken, navigate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) {
      setSubmitError("You need to be logged in to update foods");
      return;
    }

    if (!restaurantId) {
      setSubmitError("Please select a restaurant");
      return;
    }

    if (!reason.trim()) {
      setSubmitError("Please provide a reason for the update");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Get user email from props or use a fallback
      const userEmail = userData?.email || "Unknown User";

      // Try different date formats to solve the NOT NULL constraint issue
      const now = new Date();
      const dateOptions = {
        isoString: now.toISOString(),
        formattedDate: now.toISOString().split("T")[0],
        localDate:
          now.getFullYear() +
          "-" +
          String(now.getMonth() + 1).padStart(2, "0") +
          "-" +
          String(now.getDate()).padStart(2, "0"),
      };

      console.log("Trying date formats:", dateOptions);

      // Create food change request
      const changeRequest = {
        food_id: parseInt(foodId || "0"), // Original food ID
        new_name: name,
        new_restaurant: restaurantId,
        new_serving_size: servingSize,
        new_ingredients: selectedIngredients || [], // Ensure not null
        new_is_organic: isOrganic,
        new_is_gluten_free: isGlutenFree,
        new_is_alcohol_free: isAlcoholFree,
        new_is_lactose_free: isLactoseFree,
        new_macro_table: macroTable,
        is_deletion: false, // This is an update, not a deletion
        reason: reason, // Use the reason entered by user

        // Try multiple date formats - the server should accept at least one
        date: dateOptions.localDate,

        // Include these as fallbacks in case the backend looks for them
        created_at: dateOptions.isoString,
        updated_at: dateOptions.isoString,

        updated_by: userEmail, // Use email address instead of username
      };

      console.log(
        "Sending update request:",
        JSON.stringify(changeRequest, null, 2)
      );

      // Send the change request to the food-changes endpoint
      const response = await fetch(API_ENDPOINTS.proposeChange, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(changeRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `Server returned ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.detail || "Failed to submit update request");
      }

      // Show success dialog or notification
      setSuccessDialogOpen(true);
    } catch (err: any) {
      console.error("Error proposing food update:", err);
      setSubmitError(
        err.message || "Failed to submit update request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle dialog close and navigation
  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);

    // If global notification function is provided, use it
    if (setNotificationMessage) {
      setNotificationMessage({
        text: "Food update request submitted successfully!",
        type: "success",
      });
    }

    // Navigate back to food page
    navigate(`/food/${foodId}`);
  };

  // Handle ingredient selection
  const handleIngredientToggle = (ingredientId: number) => {
    setSelectedIngredients((prevSelected) =>
      prevSelected.includes(ingredientId)
        ? prevSelected.filter((id) => id !== ingredientId)
        : [...prevSelected, ingredientId]
    );
  };

  // Handle macro table changes
  const handleMacroChange = (field: keyof MacroTable, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMacroTable((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
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
          Edit Food
        </Typography>
        <Typography variant="subtitle1">
          Update the details for this food item
        </Typography>
      </Box>

      {/* Form */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            {/* Food Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                id="food-name"
                label="Food Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                variant="outlined"
              />
            </Grid>

            {/* Restaurant Dropdown */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="restaurant-label">Restaurant</InputLabel>
                <Select
                  labelId="restaurant-label"
                  id="restaurant"
                  value={restaurantId}
                  label="Restaurant"
                  onChange={(e) => setRestaurantId(e.target.value as number)}
                  required
                >
                  {restaurants.map((restaurant) => (
                    <MenuItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Serving Size */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                id="serving-size"
                label="Serving Size (g)"
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(Number(e.target.value))}
                InputProps={{ inputProps: { min: 0, step: "1" } }}
                variant="outlined"
              />
            </Grid>

            {/* Add Reason for update field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                id="update-reason"
                label="Reason for Update"
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                variant="outlined"
                placeholder="Please explain why you're updating this food information"
                helperText="This helps reviewers understand the purpose of your changes"
              />
            </Grid>

            {/* Dietary Properties */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Dietary Properties
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isOrganic}
                        onChange={(e) => setIsOrganic(e.target.checked)}
                      />
                    }
                    label="Organic"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isGlutenFree}
                        onChange={(e) => setIsGlutenFree(e.target.checked)}
                      />
                    }
                    label="Gluten Free"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isAlcoholFree}
                        onChange={(e) => setIsAlcoholFree(e.target.checked)}
                      />
                    }
                    label="Alcohol Free"
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isLactoseFree}
                        onChange={(e) => setIsLactoseFree(e.target.checked)}
                      />
                    }
                    label="Lactose Free"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Nutrition Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Nutrition Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="calories"
                    label="Calories (kcal)"
                    type="number"
                    value={macroTable.energy_kcal}
                    onChange={(e) =>
                      handleMacroChange("energy_kcal", e.target.value)
                    }
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="fat"
                    label="Fat (g)"
                    type="number"
                    value={macroTable.fat}
                    onChange={(e) => handleMacroChange("fat", e.target.value)}
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="saturated-fat"
                    label="Saturated Fat (g)"
                    type="number"
                    value={macroTable.saturated_fat}
                    onChange={(e) =>
                      handleMacroChange("saturated_fat", e.target.value)
                    }
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="carbs"
                    label="Carbohydrates (g)"
                    type="number"
                    value={macroTable.carbohydrates}
                    onChange={(e) =>
                      handleMacroChange("carbohydrates", e.target.value)
                    }
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="sugars"
                    label="Sugars (g)"
                    type="number"
                    value={macroTable.sugars}
                    onChange={(e) =>
                      handleMacroChange("sugars", e.target.value)
                    }
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="fiber"
                    label="Fiber (g)"
                    type="number"
                    value={macroTable.fiber}
                    onChange={(e) => handleMacroChange("fiber", e.target.value)}
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="protein"
                    label="Protein (g)"
                    type="number"
                    value={macroTable.protein}
                    onChange={(e) =>
                      handleMacroChange("protein", e.target.value)
                    }
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    id="salt"
                    label="Salt (g)"
                    type="number"
                    value={macroTable.salt}
                    onChange={(e) => handleMacroChange("salt", e.target.value)}
                    InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Ingredients */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ingredients
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select all ingredients that are part of this food item:
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                {ingredients.map((ingredient) => (
                  <Chip
                    key={ingredient.id}
                    label={ingredient.name}
                    onClick={() => handleIngredientToggle(ingredient.id)}
                    color={
                      selectedIngredients.includes(ingredient.id)
                        ? "primary"
                        : "default"
                    }
                    variant={
                      selectedIngredients.includes(ingredient.id)
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 4, display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                disabled={submitting}
                startIcon={
                  submitting ? <CircularProgress size={20} /> : <SaveIcon />
                }
                sx={{
                  backgroundColor: "#FF8C00",
                  "&:hover": { backgroundColor: "#e67e00" },
                }}
              >
                {submitting ? "Submitting..." : "Save Changes"}
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => navigate(`/food/${foodId}`)}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Add Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={handleSuccessDialogClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Update Request Submitted Successfully"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 40, mr: 2 }}
            />
            <DialogContentText id="alert-dialog-description">
              Your food update request has been submitted for approval.
              Supervisors will review the changes before they are applied.
            </DialogContentText>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleSuccessDialogClose}
            color="primary"
            variant="contained"
            autoFocus
          >
            Return to Food Page
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditFood;
