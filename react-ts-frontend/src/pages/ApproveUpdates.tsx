import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FoodChange, Ingredient, Food, MacroTable } from "../interfaces";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import UpdateIcon from "@mui/icons-material/Update";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Slide, { SlideProps } from "@mui/material/Slide";

interface ApproveUpdatesProps {
  accessToken: string | null;
  userId?: number;
  ingredients: Ingredient[];
}

// This interface extends FoodChange to include the original food data we'll fetch
interface ExtendedFoodChange extends FoodChange {
  original_food?: Food;
  created_at: string;
  user_name?: string;
  reason?: string;
}

// Function for transition effect
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const ApproveUpdates: React.FC<ApproveUpdatesProps> = ({
  accessToken,
  userId,
  ingredients,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<ExtendedFoodChange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    changeId: number | null;
    action: "approve" | "reject";
  }>({
    open: false,
    changeId: null,
    action: "approve",
  });

  useEffect(() => {
    // First check proper navigation flow
    const fromApprovals =
      location.state && location.state.fromApprovals === true;

    if (!fromApprovals) {
      navigate("/forbidden");
      return;
    }

    // Then check authentication - redirect to forbidden
    if (!accessToken || !userId) {
      navigate("/forbidden");
      return;
    }

    // Original fetch logic
    fetchUpdates();
  }, [accessToken, userId, location, navigate]);

  const fetchUpdates = async () => {
    if (!accessToken || !userId) {
      setError("You need to be logged in to access this page");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8000/food-changes/updates/",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Assuming the backend returns food changes with original_food included
        setUpdates(data);
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError("Failed to fetch food update requests");
      }
    } catch (error) {
      console.error("Error fetching food updates:", error);
      setError("An error occurred while fetching update requests");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenConfirm = (
    changeId: number,
    action: "approve" | "reject"
  ) => {
    setConfirmDialog({
      open: true,
      changeId,
      action,
    });
  };

  const handleCloseConfirm = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  const handleApproveUpdate = async (changeId: number) => {
    if (!accessToken) {
      setErrorMessage("You need to be logged in to approve updates");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/food-changes/${changeId}/approve/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_approved: true }),
        }
      );

      if (response.ok) {
        setUpdates((prev) => prev.filter((change) => change.id !== changeId));
        setSuccessMessage("Food update approved successfully");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to approve update");
      }
    } catch (error) {
      console.error("Error approving update:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleRejectUpdate = async (changeId: number) => {
    if (!accessToken) {
      setErrorMessage("You need to be logged in to reject updates");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/food-changes/${changeId}/reject/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_rejected: true }),
        }
      );

      if (response.ok) {
        setUpdates((prev) => prev.filter((change) => change.id !== changeId));
        setSuccessMessage("Food update rejected successfully");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to reject update");
      }
    } catch (error) {
      console.error("Error rejecting update:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleConfirmAction = () => {
    if (confirmDialog.changeId) {
      if (confirmDialog.action === "approve") {
        handleApproveUpdate(confirmDialog.changeId);
      } else {
        handleRejectUpdate(confirmDialog.changeId);
      }
      handleCloseConfirm();
    }
  };

  // Function to identify and display changes between original and updated food data
  const renderChanges = (change: ExtendedFoodChange) => {
    if (!change.original_food) {
      return <Typography>Original food details not available</Typography>;
    }

    const original = change.original_food;
    const changedFields: { field: string; original: any; updated: any }[] = [];

    // Compare basic fields
    if (original.name !== change.new_name) {
      changedFields.push({
        field: "name",
        original: original.name,
        updated: change.new_name,
      });
    }

    if (original.restaurant !== change.new_restaurant) {
      changedFields.push({
        field: "restaurant",
        original: original.restaurant_name,
        updated: change.new_restaurant_name,
      });
    }

    if (original.serving_size !== change.new_serving_size) {
      changedFields.push({
        field: "serving_size",
        original: original.serving_size,
        updated: change.new_serving_size,
      });
    }

    // Compare boolean flags
    if (original.is_organic !== change.new_is_organic) {
      changedFields.push({
        field: "is_organic",
        original: original.is_organic ? "Yes" : "No",
        updated: change.new_is_organic ? "Yes" : "No",
      });
    }

    if (original.is_gluten_free !== change.new_is_gluten_free) {
      changedFields.push({
        field: "is_gluten_free",
        original: original.is_gluten_free ? "Yes" : "No",
        updated: change.new_is_gluten_free ? "Yes" : "No",
      });
    }

    if (original.is_alcohol_free !== change.new_is_alcohol_free) {
      changedFields.push({
        field: "is_alcohol_free",
        original: original.is_alcohol_free ? "Yes" : "No",
        updated: change.new_is_alcohol_free ? "Yes" : "No",
      });
    }

    if (original.is_lactose_free !== change.new_is_lactose_free) {
      changedFields.push({
        field: "is_lactose_free",
        original: original.is_lactose_free ? "Yes" : "No",
        updated: change.new_is_lactose_free ? "Yes" : "No",
      });
    }

    // Compare macro_table
    if (original.macro_table && change.new_macro_table) {
      Object.keys(original.macro_table).forEach((key) => {
        const typedKey = key as keyof MacroTable;
        if (
          original.macro_table[typedKey] !== change.new_macro_table[typedKey]
        ) {
          changedFields.push({
            field: `macro_table.${key}`,
            original: original.macro_table[typedKey],
            updated: change.new_macro_table[typedKey],
          });
        }
      });
    }

    // Compare ingredients (more complex as they are arrays)
    if (
      JSON.stringify(original.ingredients) !==
      JSON.stringify(change.new_ingredients)
    ) {
      changedFields.push({
        field: "ingredients",
        original: original.ingredients,
        updated: change.new_ingredients,
      });
    }

    return (
      <List dense>
        {changedFields.map((item, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <EditIcon color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={`${
                item.field.charAt(0).toUpperCase() +
                item.field.slice(1).replace("_", " ")
              }`}
              secondary={
                item.field === "ingredients"
                  ? "Ingredients list has been modified"
                  : `Changed from "${item.original}" to "${item.updated}"`
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const getIngredientNames = (ingredientIds: number[]): string[] => {
    return (
      ingredientIds?.map((id) => {
        const ingredient = ingredients.find((ing) => ing.id === id);
        return ingredient ? ingredient.name : `Unknown (ID: ${id})`;
      }) || []
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Orange header section */}
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
          Food Update Requests
        </Typography>
        <Typography variant="subtitle1">
          Review and approve requests to update food items
        </Typography>
      </Box>

      {/* Main content section */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : updates.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No food update requests pending approval
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {updates.map((change) => (
              <Grid item xs={12} key={change.id}>
                <Card
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s",
                    "&:hover": {
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box sx={{ position: "relative", mr: 2 }}>
                        <CardMedia
                          component="img"
                          sx={{ width: 80, height: 80, borderRadius: 1 }}
                          image={
                            change.original_food?.image ||
                            change.new_image ||
                            "https://via.placeholder.com/80x80?text=No+Image"
                          }
                          alt={change.new_name}
                        />
                        <Chip
                          label="Update"
                          color="primary"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: -8,
                            right: -8,
                            fontWeight: "bold",
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="h6" component="h2">
                          {change.new_name}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <RestaurantIcon
                            sx={{
                              color: "text.secondary",
                              mr: 1,
                              fontSize: 18,
                            }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {change.new_restaurant_name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Changes summary */}
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Proposed Changes:
                    </Typography>
                    <Box sx={{ mb: 2 }}>{renderChanges(change)}</Box>

                    <Accordion sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>View More Details</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Original Ingredients:
                            </Typography>
                            <List dense>
                              {change.original_food?.ingredients?.map(
                                (id, index) => (
                                  <ListItem key={index} dense>
                                    <Typography variant="body2">
                                      • {getIngredientNames([id])}
                                    </Typography>
                                  </ListItem>
                                )
                              )}
                            </List>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Updated Ingredients:
                            </Typography>
                            <List dense>
                              {change.new_ingredients?.map((id, index) => (
                                <ListItem key={index} dense>
                                  <Typography variant="body2">
                                    • {getIngredientNames([id])}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block">
                        Requested by: {change.user_name || "Unknown User"}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: "text.secondary" }}
                      >
                        Request date:{" "}
                        {new Date(change.created_at).toLocaleDateString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Reason: {change.reason || "No reason provided"}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    {change.original_food && (
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        href={`/food/${change.original_food.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        View Original Food
                      </Button>
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Button
                      size="small"
                      color="primary"
                      startIcon={<UpdateIcon />}
                      onClick={() => handleOpenConfirm(change.id, "approve")}
                    >
                      Approve Update
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<CancelOutlinedIcon />}
                      onClick={() => handleOpenConfirm(change.id, "reject")}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.action === "approve"
            ? "Confirm Food Update"
            : "Reject Update Request"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.action === "approve"
              ? "Are you sure you want to approve this update? This will modify the food item in the database."
              : "Are you sure you want to reject this update request? The food item will remain unchanged."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.action === "approve" ? "primary" : "error"}
            autoFocus
          >
            {confirmDialog.action === "approve"
              ? "Approve Update"
              : "Reject Request"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success & error notifications */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {successMessage ? (
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
        ) : undefined}
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {errorMessage ? (
          <MuiAlert
            elevation={6}
            variant="filled"
            severity="error"
            onClose={handleCloseSnackbar}
          >
            {errorMessage}
          </MuiAlert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
};

export default ApproveUpdates;
