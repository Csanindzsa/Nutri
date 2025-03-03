import React from "react";
import { Food, Ingredient, MacroTable } from "../interfaces";
import { useNavigate } from "react-router-dom"; // Add this import
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Card,
  CardMedia,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button, // Add this import
} from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import EggIcon from "@mui/icons-material/Egg";
import EditIcon from "@mui/icons-material/Edit"; // Add this import
import { styled } from "@mui/material/styles";

interface ViewFoodProps {
  food: Food;
  ingredients: Ingredient[];
  accessToken?: string | null; // Add this prop
}

// Styled components for nutrition facts table
const NutritionFactsContainer = styled(Box)(({ theme }) => ({
  border: "1px solid #000",
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "100%",
  margin: "0 auto",
  fontFamily: '"Helvetica", "Arial", sans-serif',
  backgroundColor: "white",
}));

const NutritionFactsHeader = styled(Typography)({
  fontSize: "2rem",
  fontWeight: "bold",
  borderBottom: "10px solid black",
  paddingBottom: "5px",
  margin: "0 0 5px 0",
});

const NutritionRow = styled(Box)<{
  bold?: boolean;
  indent?: boolean;
  doubleIndent?: boolean;
  noBorder?: boolean;
}>(({ bold, indent, doubleIndent, noBorder }) => ({
  display: "flex",
  justifyContent: "space-between",
  padding: "2px 0",
  borderBottom: noBorder ? "none" : "1px solid #ddd",
  fontWeight: bold ? "bold" : "normal",
  paddingLeft: doubleIndent ? "30px" : indent ? "15px" : "0",
}));

const ThickDivider = styled(Box)({
  borderBottom: "5px solid #000",
  marginTop: "5px",
  marginBottom: "5px",
});

const MediumDivider = styled(Box)({
  borderBottom: "3px solid #000",
  marginTop: "3px",
  marginBottom: "3px",
});

const ViewFood: React.FC<ViewFoodProps> = ({
  food,
  ingredients,
  accessToken,
}) => {
  const navigate = useNavigate(); // Add this

  // Add handler function for edit button
  const handleEditFood = () => {
    navigate(`/food/${food.id}/edit`);
  };

  // Map ingredient IDs to their names
  const getIngredientNames = (ingredientIds: number[]): string[] => {
    return ingredientIds.map((id) => {
      const ingredient = ingredients.find((ing) => ing.id === id);
      return ingredient ? ingredient.name : `Unknown Ingredient (ID: ${id})`;
    });
  };

  // Function for formatting numbers consistently
  const formatNutritionValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "0";

    // For values that are close to integers, don't show decimals
    if (Math.abs(value - Math.round(value)) < 0.01) {
      return Math.round(value).toString();
    }

    // Otherwise show one decimal place
    return value.toFixed(1);
  };

  // Function to render the macro table in a more appealing way
  const renderMacroTable = (
    macros: MacroTable | undefined,
    servingSize?: number
  ) => {
    if (!macros)
      return <Typography>No nutritional information available</Typography>;

    // Calculate calories from fat
    const caloriesFromFat = macros.fat ? macros.fat * 9 : 0;

    // Set serving size with a default value if not provided
    const servingSizeValue = servingSize || 100;

    return (
      <NutritionFactsContainer>
        <NutritionFactsHeader>Nutrition Facts</NutritionFactsHeader>

        <NutritionRow>
          <Typography>Serving Size</Typography>
          <Typography>{servingSizeValue}g</Typography>
        </NutritionRow>

        <ThickDivider />

        <NutritionRow bold>
          <Typography>Amount Per Serving</Typography>
        </NutritionRow>

        <NutritionRow bold>
          <Typography variant="h6">Calories</Typography>
          <Typography variant="h6">
            {formatNutritionValue(macros.energy_kcal)}
          </Typography>
        </NutritionRow>

        <NutritionRow>
          <Typography>Calories from Fat</Typography>
          <Typography>{Math.round(caloriesFromFat)}</Typography>
        </NutritionRow>

        <ThickDivider />

        <NutritionRow noBorder>
          <Typography align="right" variant="caption">
            % Daily Value*
          </Typography>
        </NutritionRow>

        <NutritionRow bold>
          <Typography>Total Fat</Typography>
          <Typography>{formatNutritionValue(macros.fat)}g</Typography>
        </NutritionRow>

        <NutritionRow indent>
          <Typography>Saturated Fat</Typography>
          <Typography>{formatNutritionValue(macros.saturated_fat)}g</Typography>
        </NutritionRow>

        <NutritionRow bold>
          <Typography>Total Carbohydrates</Typography>
          <Typography>{formatNutritionValue(macros.carbohydrates)}g</Typography>
        </NutritionRow>

        <NutritionRow indent>
          <Typography>Dietary Fiber</Typography>
          <Typography>{formatNutritionValue(macros.fiber)}g</Typography>
        </NutritionRow>

        <NutritionRow indent>
          <Typography>Sugars</Typography>
          <Typography>{formatNutritionValue(macros.sugars)}g</Typography>
        </NutritionRow>

        <NutritionRow bold>
          <Typography>Protein</Typography>
          <Typography>{formatNutritionValue(macros.protein)}g</Typography>
        </NutritionRow>

        <MediumDivider />

        <NutritionRow>
          <Typography>Salt</Typography>
          <Typography>{formatNutritionValue(macros.salt)}g</Typography>
        </NutritionRow>

        <ThickDivider />

        <Typography variant="caption">
          * Percent Daily Values are based on a 2,000 calorie diet. Your daily
          values may be higher or lower depending on your calorie needs.
        </Typography>
      </NutritionFactsContainer>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header with orange background */}
      <Box
        sx={{
          backgroundColor: "#FF8C00",
          py: 3,
          px: 4,
          borderRadius: "10px 10px 0 0",
          mb: 0,
          color: "white",
          display: "flex",
          justifyContent: "space-between", // Add this for button alignment
          alignItems: "center", // Add this for vertical alignment
        }}
      >
        <div>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {food.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <RestaurantIcon sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              {food.restaurant_name || "Unknown Restaurant"}
            </Typography>
          </Box>
        </div>

        {/* Add Edit Button - only shown when accessToken is available */}
        {accessToken && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EditIcon />}
            onClick={handleEditFood}
            sx={{
              bgcolor: "white",
              color: "#FF8C00",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.9)",
              },
            }}
          >
            Edit Food
          </Button>
        )}
      </Box>

      {/* Main Content */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        <Grid container spacing={4}>
          {/* Food Image */}
          <Grid item xs={12} md={5}>
            <Card
              elevation={2}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: 2,
              }}
            >
              {food.image ? (
                <CardMedia
                  component="img"
                  image={food.image}
                  alt={food.name}
                  sx={{
                    height: 350,
                    objectFit: "cover",
                    width: "100%",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    height: 350,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.04)",
                  }}
                >
                  <LocalDiningIcon
                    sx={{ fontSize: 100, color: "rgba(0,0,0,0.2)" }}
                  />
                </Box>
              )}
            </Card>
          </Grid>

          {/* Food Details */}
          <Grid item xs={12} md={7}>
            <Box>
              {/* Dietary Properties */}
              <Typography variant="h6" gutterBottom>
                Dietary Information
              </Typography>
              <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 1 }}>
                <Chip
                  icon={food.is_organic ? <CheckIcon /> : <CancelIcon />}
                  label="Organic"
                  color={food.is_organic ? "success" : "default"}
                  variant={food.is_organic ? "filled" : "outlined"}
                />
                <Chip
                  icon={food.is_gluten_free ? <CheckIcon /> : <CancelIcon />}
                  label="Gluten Free"
                  color={food.is_gluten_free ? "primary" : "default"}
                  variant={food.is_gluten_free ? "filled" : "outlined"}
                />
                <Chip
                  icon={food.is_alcohol_free ? <CheckIcon /> : <CancelIcon />}
                  label="Alcohol Free"
                  color={food.is_alcohol_free ? "primary" : "default"}
                  variant={food.is_alcohol_free ? "filled" : "outlined"}
                />
                <Chip
                  icon={food.is_lactose_free ? <CheckIcon /> : <CancelIcon />}
                  label="Lactose Free"
                  color={food.is_lactose_free ? "primary" : "default"}
                  variant={food.is_lactose_free ? "filled" : "outlined"}
                />
              </Box>

              {/* Serving Size */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Serving Size:
                </Typography>
                <Typography variant="body1">
                  {food.serving_size
                    ? `${food.serving_size} g`
                    : "Not specified"}
                </Typography>
              </Box>

              {/* Ingredients */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Ingredients
              </Typography>
              <Box sx={{ mb: 3 }}>
                {food.ingredients && food.ingredients.length > 0 ? (
                  <List dense>
                    {getIngredientNames(food.ingredients).map((name, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <EggIcon color="action" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={name} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">
                    No ingredients listed
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Nutritional Information Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Nutritional Information
            </Typography>
            <Box sx={{ mx: "auto", width: "100%" }}>
              {renderMacroTable(food.macro_table, food.serving_size)}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ViewFood;
