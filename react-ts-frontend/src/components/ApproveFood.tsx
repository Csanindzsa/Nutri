import React, { useState } from "react";
import { Food, Ingredient, MacroTable } from "../interfaces";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Alert,
  Divider,
  Card,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Container,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CheckIcon from "@mui/icons-material/Check";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import ApprovalIcon from "@mui/icons-material/Approval";
import PersonIcon from "@mui/icons-material/Person";
import EggIcon from "@mui/icons-material/Egg";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { styled } from "@mui/material/styles";
import { API_ENDPOINTS } from "../config/environment";
import {
  APPROVAL_CONFIG,
  calculateApprovalPercentage,
  getApprovalStatusText,
  getApprovalProgressColor,
} from "../config/approvalConfig";
import LinearProgress from "@mui/material/LinearProgress";
import HazardLevelIndicator from "./HazardLevelIndicator";
import { getHazardLabel, getHazardColor } from "../utils/hazardUtils";

interface ApproveFoodProps {
  food: Food;
  accessToken: string | null;
  userId: number | undefined;
  ingredients: Ingredient[];
  onApprove: (updatedFood: Food) => void;
  showApproveButton?: boolean;
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

const ApproveFood: React.FC<ApproveFoodProps> = ({
  food,
  accessToken,
  userId,
  ingredients,
  onApprove,
  showApproveButton = true,
}) => {
  const [isUserApproved, setIsUserApproved] = useState<boolean>(() =>
    food.approved_supervisors != null
      ? food.approved_supervisors.some((supervisor) => supervisor.id === userId)
      : false
  );
  const [approvedCount, setApprovedCount] = useState<number>(
    food.approved_supervisors_count ?? 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Calculate approval percentage for progress bar
  const approvalPercentage = calculateApprovalPercentage(approvedCount);
  const approvalColor = getApprovalProgressColor(approvedCount);

  // Update this function to return more information about each ingredient
  const getIngredientDetails = (
    ingredientIds: number[]
  ): { name: string; hazardLevel: number }[] => {
    return ingredientIds.map((id) => {
      const ingredient = ingredients.find((ing) => ing.id === id);
      return {
        name: ingredient ? ingredient.name : `Unknown Ingredient (ID: ${id})`,
        hazardLevel: ingredient ? ingredient.hazard_level : 0,
      };
    });
  };

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

  const handleApprove = async () => {
    if (!accessToken) {
      setError("Please log in to approve this food");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.acceptFood(food.id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_approved: (food.approved_supervisors_count ?? 0) + 1,
        }),
      });

      if (response.ok) {
        const updatedFood = await response.json();
        setSuccess(true);
        setIsUserApproved(true);
        setApprovedCount((prev) => prev + 1);
        onApprove(updatedFood);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to approve food");
      }
    } catch (error) {
      console.error("Error approving food:", error);
      setError("An error occurred while approving the food. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          {food.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <RestaurantIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            {food.restaurant_name || "Unknown Restaurant"}
          </Typography>
        </Box>
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
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 4 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setSuccess(false)}
              >
                DISMISS
              </Button>
            }
          >
            Food approved successfully! Thank you for your contribution.
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => setError(null)}
              >
                DISMISS
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Food Image */}
          <Grid item xs={12} md={5}>
            <Card
              elevation={2}
              sx={{
                height: "auto",
                maxHeight: 450,
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
              {/* Hazard Level Indicator - Add this section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Hazard Level
                </Typography>
                <Box sx={{ maxWidth: "300px" }}>
                  <HazardLevelIndicator
                    hazardLevel={food.hazard_level || 0}
                    size="large"
                  />
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    {getHazardLabel(food.hazard_level || 0)}: This food has been
                    rated based on its ingredients.
                  </Typography>
                </Box>
              </Box>

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

              {/* Updated Ingredients Section with scrollable container */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Ingredients
              </Typography>
              <Box sx={{ mb: 3 }}>
                {food.ingredients && food.ingredients.length > 0 ? (
                  <Box
                    sx={{
                      maxHeight: 250,
                      overflowY: "auto",
                      pr: 1,
                      "&::-webkit-scrollbar": {
                        width: 8,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: 4,
                      },
                      "&::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: 4,
                      },
                    }}
                  >
                    <List dense>
                      {getIngredientDetails(food.ingredients).map(
                        (ingredient, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              borderLeft: `4px solid ${getHazardColor(
                                ingredient.hazardLevel
                              )}`,
                              pl: 2,
                              mb: 0.5,
                              borderRadius: 1,
                              bgcolor: `${getHazardColor(
                                ingredient.hazardLevel
                              )}15`,
                            }}
                          >
                            <ListItemIcon>
                              <EggIcon
                                fontSize="small"
                                sx={{
                                  color: getHazardColor(ingredient.hazardLevel),
                                }}
                              />
                            </ListItemIcon>
                            <ListItemText
                              primary={ingredient.name}
                              secondary={getHazardLabel(ingredient.hazardLevel)}
                            />
                            <Tooltip
                              title={`Hazard Level: ${ingredient.hazardLevel}`}
                            >
                              <Box
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: "50%",
                                  bgcolor: getHazardColor(
                                    ingredient.hazardLevel
                                  ),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "white",
                                  fontWeight: "bold",
                                  fontSize: "0.8rem",
                                }}
                              >
                                {ingredient.hazardLevel}
                              </Box>
                            </Tooltip>
                          </ListItem>
                        )
                      )}
                    </List>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No ingredients listed
                  </Typography>
                )}

                {/* Add a legend for hazard levels */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    border: "1px solid #eee",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Ingredient Hazard Level Legend:
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}
                  >
                    {[0, 1, 2, 3, 4].map((level) => (
                      <Box
                        key={level}
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: "50%",
                            bgcolor: getHazardColor(level),
                            mr: 1,
                          }}
                        />
                        <Typography variant="caption">
                          {level}: {getHazardLabel(level)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              {/* Conditionally render approval section */}
              {showApproveButton && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Approval Status
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "background.default",
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Stack direction="column" spacing={1.5} mb={2}>
                      {/* Add approval progress bar */}
                      <Box sx={{ width: "100%" }}>
                        <Typography variant="body2" gutterBottom>
                          {getApprovalStatusText(approvedCount)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={approvalPercentage}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: "rgba(0,0,0,0.1)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: approvalColor,
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <ApprovalIcon color="action" sx={{ mr: 1 }} />
                        <Typography>
                          <strong>{approvedCount}</strong> of{" "}
                          {APPROVAL_CONFIG.REQUIRED_APPROVALS} required
                          approvals
                        </Typography>
                      </Box>

                      {approvedCount >= APPROVAL_CONFIG.REQUIRED_APPROVALS && (
                        <Alert severity="success">
                          This food has been fully approved and is now in the
                          database
                        </Alert>
                      )}
                    </Stack>

                    {accessToken ? (
                      isUserApproved ? (
                        <Alert
                          icon={<CheckCircleIcon fontSize="inherit" />}
                          severity="success"
                        >
                          You have approved this food item
                        </Alert>
                      ) : (
                        <Button
                          variant="contained"
                          color="success"
                          fullWidth
                          disabled={isLoading}
                          onClick={handleApprove}
                          startIcon={
                            isLoading ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <ThumbUpAltIcon />
                            )
                          }
                          sx={{ mt: 1 }}
                        >
                          {isLoading ? "Processing..." : "Approve This Food"}
                        </Button>
                      )
                    ) : (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Please log in to approve this food item
                      </Alert>
                    )}
                  </Box>
                </>
              )}
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

export default ApproveFood;
