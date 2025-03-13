import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Restaurant, Food, Ingredient } from "../interfaces";
import {
  Container,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Paper,
  Grid,
  Divider,
  Alert,
  FormGroup,
  FormLabel,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  Stack,
  List,
  ListItemButton, // Changed ListItem to ListItemButton
  Snackbar,
  Slide,
  SlideProps,
  ListItemText, // Add this import
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import MuiAlert from "@mui/material/Alert";
import {API_BASE_URL} from "../config/environment";

interface CreateFoodProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  onCreateFood: (newFood: Food) => void;
}

const CreateFood: React.FC<CreateFoodProps> = ({
  accessToken,
  restaurants = [], // Provide default empty arrays
  ingredients = [],
  onCreateFood = () => {}, // Provide default no-op function
}) => {
  // Add location for checking navigation state
  const location = useLocation();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    restaurant: null as number | null,
    ingredients: [] as number[],
    macro_table: {
      energy_kcal: 0,
      fat: 0,
      saturated_fat: 0,
      carbohydrates: 0,
      sugars: 0,
      protein: 0,
      fiber: 0,
      salt: 0,
    },
    is_organic: false,
    is_gluten_free: false,
    is_alcohol_free: false,
    is_lactose_free: false,
    serving_size: 0,
  });

  // Input display values state
  const [inputValues, setInputValues] = useState({
    energy_kcal: "",
    fat: "",
    saturated_fat: "",
    carbohydrates: "",
    sugars: "",
    protein: "",
    fiber: "",
    salt: "",
    serving_size: "",
  });

  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Function for transition effect
  function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (name === "serving_size") {
      // Update both the display value and the actual value
      setInputValues((prev) => ({
        ...prev,
        [name]: value,
      }));

      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name as string]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name as string]: value,
      }));
    }
  };

  const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update the display value
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Update the actual numeric value
    setFormData((prev) => ({
      ...prev,
      macro_table: {
        ...prev.macro_table,
        [name]: value === "" ? 0 : parseFloat(value),
      },
    }));
  };

  const handleRestaurantChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setFormData((prev) => ({
      ...prev,
      restaurant: event.target.value as number,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleIngredient = (ingredientId: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.includes(ingredientId)
        ? prev.ingredients.filter((id) => id !== ingredientId)
        : [...prev.ingredients, ingredientId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!accessToken) {
      setError("Please log in to create a food item");
      return;
    }

    if (!formData.restaurant || formData.ingredients.length === 0) {
      setError(
        "Please fill in all required fields and select at least one ingredient."
      );
      return;
    }

    //if the calories are negative, they will become positive
    let macroTable = formData.macro_table;
    if (macroTable.energy_kcal < 0){
      macroTable.energy_kcal *= -1;
    }

    // Convert all numeric values to their absolute values
    (Object.keys(macroTable) as Array<keyof typeof macroTable>).forEach((key) => {
      if (typeof macroTable[key] === "number") {
        macroTable[key] = Math.abs(macroTable[key]);
      }
    });
  

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("restaurant", String(formData.restaurant));
    formData.ingredients.forEach((ingredientId) => {
      formDataToSend.append("ingredients", String(ingredientId));
    });
    formDataToSend.append("macro_table", JSON.stringify(macroTable));
    formDataToSend.append("is_organic", String(formData.is_organic));
    formDataToSend.append("is_gluten_free", String(formData.is_gluten_free));
    formDataToSend.append("is_alcohol_free", String(formData.is_alcohol_free));
    formDataToSend.append("is_lactose_free", String(formData.is_lactose_free));
    formDataToSend.append("serving_size", String(Math.abs(formData.serving_size)));

    if (image) {
      formDataToSend.append("image", image);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/foods/create/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const createdFood = await response.json();
        onCreateFood(createdFood);
        setSuccess(true);
        setSuccessMessage(
          "Food created successfully! It will be reviewed by supervisors."
        );
        setTimeout(() => {
          navigate("/?success=true");
        }, 1500);
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        const errorData = await response.json().catch(() => null);
        setError(
          errorData?.detail || "Failed to create food. Please try again."
        );
        setErrorMessage(
          errorData?.detail ||
            "Failed to create food. Please check your inputs."
        );
      }
    } catch (error) {
      console.error("Error creating food:", error);
      setError(
        "An error occurred while creating the food. Please check your connection and try again."
      );
      setErrorMessage(
        "An error occurred while creating the food. Please try again."
      );
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const getIngredientName = (id: number): string => {
    const ingredient = ingredients.find((ing) => ing.id === id);
    return ingredient ? ingredient.name : "Unknown";
  };

  // Add this useEffect to handle potential data loading issues
  useEffect(() => {
    if (!restaurants.length || !ingredients.length) {
      console.warn(
        "CreateFood component received empty restaurants or ingredients arrays"
      );
    }
  }, [restaurants, ingredients]);

  // Check if accessed through proper navigation
  useEffect(() => {
    // User must be authenticated to create food, but redirect to forbidden instead of login
    if (!accessToken) {
      navigate("/forbidden"); // Changed from /login to /forbidden
      return;
    }

    // Check if user came from proper navigation flow
    // Allow access if coming from navbar (lacks state) or has proper state
    const fromNavbar = !location.state;
    const fromProperFlow =
      location.state && location.state.fromProperFlow === true;

    if (!fromNavbar && !fromProperFlow) {
      navigate("/forbidden");
    }
  }, [accessToken, location, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Add a loading state check */}
      {!restaurants.length || !ingredients.length ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6">Loading data...</Typography>
        </Box>
      ) : (
        <>
          {/* Header with orange background */}
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
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 600 }}
            >
              Create New Food
            </Typography>
            <Typography variant="subtitle1">
              Add a new food item to the Nutri database
            </Typography>
          </Box>

          {/* Main Form */}
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: "0 0 10px 10px",
              bgcolor: "rgba(255,255,255,0.95)",
            }}
          >
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Food successfully created! Redirecting...
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={4}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <TextField
                    fullWidth
                    required
                    label="Food Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                  />

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel id="restaurant-label">Restaurant</InputLabel>
                    <Select
                      labelId="restaurant-label"
                      name="restaurant"
                      value={formData.restaurant || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          restaurant: e.target.value as number,
                        }))
                      }
                      startAdornment={
                        <InputAdornment position="start">
                          <RestaurantIcon color="action" />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="" disabled>
                        Select a restaurant
                      </MenuItem>
                      {restaurants.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Serving Size (grams)"
                    name="serving_size"
                    type="number"
                    value={inputValues.serving_size}
                    onChange={handleInputChange}
                    margin="normal"
                    variant="outlined"
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">g</InputAdornment>
                      ),
                    }}
                  />

                  {/* Dietary Information */}
                  <Box sx={{ mt: 4, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Dietary Information
                    </Typography>
                    <FormGroup>
                      <Grid container>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="is_organic"
                                checked={formData.is_organic}
                                onChange={handleInputChange}
                                color="success"
                              />
                            }
                            label="Organic"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="is_gluten_free"
                                checked={formData.is_gluten_free}
                                onChange={handleInputChange}
                                color="primary"
                              />
                            }
                            label="Gluten Free"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="is_alcohol_free"
                                checked={formData.is_alcohol_free}
                                onChange={handleInputChange}
                                color="primary"
                              />
                            }
                            label="Alcohol Free"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="is_lactose_free"
                                checked={formData.is_lactose_free}
                                onChange={handleInputChange}
                                color="primary"
                              />
                            }
                            label="Lactose Free"
                          />
                        </Grid>
                      </Grid>
                    </FormGroup>
                  </Box>

                  {/* Image Upload */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Food Image
                    </Typography>
                    <Box
                      sx={{
                        border: "2px dashed #ccc",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{
                          opacity: 0,
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                        }}
                        id="food-image-upload"
                      />
                      <label htmlFor="food-image-upload">
                        <CloudUploadIcon
                          sx={{ fontSize: 40, color: "#FF8C00", mb: 1 }}
                        />
                        <Typography>
                          {image ? "Change image" : "Click to upload image"}
                        </Typography>
                      </label>
                    </Box>

                    {imagePreview && (
                      <Box sx={{ mt: 2, textAlign: "center" }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Nutritional Information and Ingredients */}
                <Grid item xs={12} md={6}>
                  {/* Macro Table */}
                  <Typography variant="h6" gutterBottom>
                    Nutritional Information (per 100g)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Calories"
                        name="energy_kcal"
                        type="number"
                        value={inputValues.energy_kcal}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">kcal</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Protein"
                        name="protein"
                        type="number"
                        value={inputValues.protein}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Fat"
                        name="fat"
                        type="number"
                        value={inputValues.fat}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Saturated Fat"
                        name="saturated_fat"
                        type="number"
                        value={inputValues.saturated_fat}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Carbohydrates"
                        name="carbohydrates"
                        type="number"
                        value={inputValues.carbohydrates}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Sugars"
                        name="sugars"
                        type="number"
                        value={inputValues.sugars}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Fiber"
                        name="fiber"
                        type="number"
                        value={inputValues.fiber}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Salt"
                        name="salt"
                        type="number"
                        value={inputValues.salt}
                        onChange={handleMacroChange}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">g</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Ingredients */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Ingredients
                    </Typography>
                    <FormLabel component="legend" sx={{ mt: 1, mb: 2 }}>
                      Select all ingredients used in this food (at least one
                      required)
                    </FormLabel>

                    {/* Selected ingredients preview */}
                    {formData.ingredients.length > 0 && (
                      <Box
                        sx={{
                          mb: 2,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {formData.ingredients.map((id) => (
                          <Chip
                            key={id}
                            label={getIngredientName(id)}
                            onDelete={() => toggleIngredient(id)}
                            color="primary"
                            size="small"
                          />
                        ))}
                      </Box>
                    )}

                    {/* Ingredient selection */}
                    <Box
                      sx={{
                        maxHeight: "200px",
                        overflow: "auto",
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                      }}
                    >
                      <List dense>
                        {ingredients.map((ingredient) => (
                          <React.Fragment key={ingredient.id}>
                            <ListItemButton
                              onClick={() => toggleIngredient(ingredient.id)}
                              selected={formData.ingredients.includes(
                                ingredient.id
                              )}
                              sx={{
                                "&.Mui-selected": {
                                  backgroundColor: "rgba(255, 140, 0, 0.1)",
                                },
                              }}
                            >
                              <Checkbox
                                checked={formData.ingredients.includes(
                                  ingredient.id
                                )}
                                onChange={() => {}}
                                color="primary"
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <ListItemText primary={ingredient.name} />
                            </ListItemButton>
                            <Divider component="li" />
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  </Box>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 3, textAlign: "center" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!accessToken}
                    sx={{
                      bgcolor: "#FF8C00",
                      px: 4,
                      py: 1.5,
                      "&:hover": {
                        bgcolor: "#e07c00",
                      },
                    }}
                  >
                    {accessToken
                      ? "Create Food"
                      : "Please Log In to Create Food"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </>
      )}
      {/* Toast notification for success */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="success"
          onClose={handleCloseSnackbar}
          sx={{ width: "100%", alignItems: "center" }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography>{successMessage}</Typography>
          </Box>
        </MuiAlert>
      </Snackbar>

      {/* Toast notification for errors */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="error"
          onClose={handleCloseSnackbar}
        >
          {errorMessage}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default CreateFood;
