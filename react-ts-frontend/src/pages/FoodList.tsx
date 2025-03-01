import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CardMedia,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  FormGroup,
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Restaurant, Food, Ingredient, MacroTable } from "../interfaces";

interface FoodListProps {
  accessToken: string | null;
  restaurants: Restaurant[];
  ingredients: Ingredient[];
  foods: Food[];
  selectedRestaurants: number[];
  setSelectedRestaurants: React.Dispatch<React.SetStateAction<number[]>>;
  selectedIngredients: number[];
  setSelectedIngredients: React.Dispatch<React.SetStateAction<number[]>>;
}

const FoodList: React.FC<FoodListProps> = ({
  accessToken,
  restaurants,
  ingredients,
  foods,
  selectedRestaurants,
  setSelectedRestaurants,
  selectedIngredients,
  setSelectedIngredients,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Add state for search term
  const [searchTerm, setSearchTerm] = useState("");

  // Add state for dietary filters
  const [dietaryFilters, setDietaryFilters] = useState({
    isOrganic: false,
    isGlutenFree: false,
    isAlcoholFree: false,
    isLactoseFree: false,
  });

  const toggleRestaurantSelection = (id: number) => {
    setSelectedRestaurants((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rid) => rid !== id)
        : [...prevSelected, id]
    );
  };

  const toggleIngredientSelection = (id: number) => {
    setSelectedIngredients((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((iid) => iid !== id)
        : [...prevSelected, id]
    );
  };

  // Update this handler to navigate to the ViewFood component instead
  const handleFoodClick = (foodId: number) => {
    navigate(`/food/${foodId}`); // Change from '/approve-food/' to '/food/'
  };

  // Handler for search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handler for restaurant selection change
  const handleRestaurantChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedRestaurants(value);
  };

  // Handler for ingredient selection change
  const handleIngredientChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedIngredients(value);
  };

  // Handler for dietary filter changes
  const handleDietaryFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDietaryFilters({
      ...dietaryFilters,
      [event.target.name]: event.target.checked,
    });
  };

  // Add this new handler for chip clicks
  const handleTagClick = (filterName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    // Update the appropriate dietary filter
    setDietaryFilters((prev) => ({
      ...prev,
      [filterName]: true,
    }));

    // Scroll back to top to make it obvious to the user that a filter was applied
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Extract search query and restaurant from URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Handle search parameter
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }

    // Handle restaurant parameter
    const restaurantId = searchParams.get("restaurant");
    if (restaurantId) {
      const id = parseInt(restaurantId);
      if (!isNaN(id)) {
        setSelectedRestaurants([id]);

        // Scroll to the filter section with smooth animation
        setTimeout(() => {
          const filterSection = document.getElementById("filter-section");
          if (filterSection) {
            filterSection.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      }
    }
  }, [location.search, setSelectedRestaurants]);

  // Filter foods based on selected restaurants, ingredients, and search term
  const filteredFoods = foods.filter((food) => {
    // Restaurant filter
    if (
      selectedRestaurants.length > 0 &&
      !selectedRestaurants.includes(food.restaurant)
    ) {
      return false;
    }

    // Ingredient filter - food must contain at least one selected ingredient
    if (
      selectedIngredients.length > 0 &&
      !food.ingredients.some((id) => selectedIngredients.includes(id))
    ) {
      return false;
    }

    // Search term filter (case insensitive)
    if (
      searchTerm.trim() !== "" &&
      !food.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Dietary filters
    if (dietaryFilters.isOrganic && !food.is_organic) return false;
    if (dietaryFilters.isGlutenFree && !food.is_gluten_free) return false;
    if (dietaryFilters.isAlcoholFree && !food.is_alcohol_free) return false;
    if (dietaryFilters.isLactoseFree && !food.is_lactose_free) return false;

    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Page Header */}
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
          Food Explorer
        </Typography>
        <Typography variant="subtitle1">
          Discover foods that match your dietary preferences
        </Typography>
      </Box>

      {/* Filters Section */}
      <Box
        id="filter-section" // Add this id for scrolling functionality
        sx={{
          p: 3,
          backgroundColor: "white",
          borderBottom: "1px solid #eaeaea",
        }}
      >
        <Grid container spacing={3}>
          {/* Search Box */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Foods"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Restaurant Filter */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Restaurants</InputLabel>
              <Select
                multiple
                value={selectedRestaurants}
                onChange={handleRestaurantChange}
                input={<OutlinedInput label="Restaurants" />}
                renderValue={(selected) => {
                  if (selected.length === restaurants.length)
                    return "All Restaurants";
                  return `${selected.length} Restaurant${
                    selected.length !== 1 ? "s" : ""
                  } Selected`;
                }}
              >
                {restaurants.map((restaurant) => (
                  <MenuItem key={restaurant.id} value={restaurant.id}>
                    <Checkbox
                      checked={selectedRestaurants.includes(restaurant.id)}
                    />
                    <ListItemText primary={restaurant.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Ingredient Filter */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Ingredients</InputLabel>
              <Select
                multiple
                value={selectedIngredients}
                onChange={handleIngredientChange}
                input={<OutlinedInput label="Ingredients" />}
                renderValue={(selected) => {
                  if (selected.length === ingredients.length)
                    return "All Ingredients";
                  return `${selected.length} Ingredient${
                    selected.length !== 1 ? "s" : ""
                  } Selected`;
                }}
              >
                {ingredients.map((ingredient) => (
                  <MenuItem key={ingredient.id} value={ingredient.id}>
                    <Checkbox
                      checked={selectedIngredients.includes(ingredient.id)}
                    />
                    <ListItemText primary={ingredient.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Dietary Filters */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Dietary Preferences
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dietaryFilters.isOrganic}
                    onChange={handleDietaryFilterChange}
                    name="isOrganic"
                  />
                }
                label="Organic"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dietaryFilters.isGlutenFree}
                    onChange={handleDietaryFilterChange}
                    name="isGlutenFree"
                  />
                }
                label="Gluten Free"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dietaryFilters.isAlcoholFree}
                    onChange={handleDietaryFilterChange}
                    name="isAlcoholFree"
                  />
                }
                label="Alcohol Free"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dietaryFilters.isLactoseFree}
                    onChange={handleDietaryFilterChange}
                    name="isLactoseFree"
                  />
                }
                label="Lactose Free"
              />
            </FormGroup>
          </Grid>
        </Grid>
      </Box>

      {/* Results Section */}
      <Box
        sx={{
          p: 3,
          backgroundColor: "white",
          borderRadius: "0 0 10px 10px",
        }}
      >
        <Typography variant="h6" gutterBottom>
          {filteredFoods.length} Results Found
        </Typography>

        <Grid container spacing={3}>
          {filteredFoods.map((food) => (
            <Grid item xs={12} sm={6} md={4} key={food.id}>
              {/* Make the entire card clickable by adding onClick */}
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s",
                  cursor: "pointer", // Add pointer cursor to indicate clickability
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleFoodClick(food.id)}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={
                    food.image ||
                    "https://via.placeholder.com/300x140?text=No+Image"
                  }
                  alt={food.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {food.name}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <RestaurantIcon
                      sx={{ color: "text.secondary", mr: 1, fontSize: 18 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {food.restaurant_name || "Unknown Restaurant"}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    {food.is_organic && (
                      <Chip
                        label="Organic"
                        size="small"
                        color="success"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                        }}
                        onClick={(e) => handleTagClick("isOrganic", e)}
                      />
                    )}
                    {food.is_gluten_free && (
                      <Chip
                        label="Gluten Free"
                        size="small"
                        color="primary"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                        }}
                        onClick={(e) => handleTagClick("isGlutenFree", e)}
                      />
                    )}
                    {food.is_lactose_free && (
                      <Chip
                        label="Lactose Free"
                        size="small"
                        color="primary"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                        }}
                        onClick={(e) => handleTagClick("isLactoseFree", e)}
                      />
                    )}
                    {food.is_alcohol_free && (
                      <Chip
                        label="Alcohol Free"
                        size="small"
                        color="primary"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8 },
                        }}
                        onClick={(e) => handleTagClick("isAlcoholFree", e)}
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent double navigation
                      handleFoodClick(food.id);
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {/* Show message if no foods match the filters */}
          {filteredFoods.length === 0 && (
            <Box
              sx={{
                width: "100%",
                textAlign: "center",
                py: 8,
                px: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No foods match your search criteria
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Try adjusting your filters or search term
              </Typography>
            </Box>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default FoodList;
