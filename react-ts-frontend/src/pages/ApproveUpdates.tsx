import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { API_ENDPOINTS, API_BASE_URL } from "../config/environment";
import {
  APPROVAL_CONFIG,
  calculateApprovalPercentage,
  getApprovalStatusText,
  getApprovalProgressColor,
} from "../config/approvalConfig";
import LinearProgress from "@mui/material/LinearProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Add this missing import

interface ApproveUpdatesProps {
  accessToken: string | null;
  userId?: number;
  ingredients: Ingredient[];
}

// This interface extends FoodChange to include the original food data we'll fetch
interface ExtendedFoodChange extends FoodChange {
  original_food?: Food;
  date: string; // Use 'date' instead of 'created_at'
  updated_by?: string; // Use 'updated_by' instead of 'user_name'
  reason?: string;
  new_approved_supervisors_count?: number;
  new_approved_supervisors?: number[];
  updated_date?: string; // Add this field from the backend
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

  // Add pagination state
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  

  const fetchUpdates = async () => {
    if (!accessToken) {
      setError("You need to be logged in to access this page");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.foodChangeUpdates, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();

        // Fetch original food data for each update
        const updatesWithOriginalFood = await Promise.all(
          data.map(async (update: ExtendedFoodChange) => {
            try {
              // Fetch the original food using the old_version field
              const foodResponse = await fetch(
                `${API_BASE_URL}/foods/${update.old_version}/`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                }
              );

              if (foodResponse.ok) {
                const originalFood = await foodResponse.json();
                return { ...update, original_food: originalFood };
              }
              return update;
            } catch (err) {
              console.error(
                `Failed to fetch original food for update ${update.id}:`,
                err
              );
              return update;
            }
          })
        );

        setUpdates(updatesWithOriginalFood);
      } else if (response.status === 401) {
        setError("Your session has expired. Please log in again.");
        navigate("/login", { state: { from: "/approve-updates" } });
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

  useEffect(() => {
    // Check authentication
    if (!accessToken) {
      navigate("/forbidden");
      return;
    }

    // Fetch the update requests
    fetchUpdates();
  }, [accessToken, userId, navigate]);

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
      const response = await fetch(API_ENDPOINTS.approveChange(changeId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update the UI by removing the approved item
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

  // Note: The backend might not support rejections, consider checking
  const handleRejectUpdate = async (changeId: number) => {
    if (!accessToken) {
      setErrorMessage("You need to be logged in to reject updates");
      return;
    }

    try {
      // This endpoint might need to be implemented on the backend
      const response = await fetch(
        `${API_BASE_URL}/food-changes/${changeId}/reject/`,
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

  // Check if the user has already approved this change
  const hasUserApproved = (change: ExtendedFoodChange): boolean => {
    return change.new_approved_supervisors?.includes(userId as number) || false;
  };

  // Improved renderChanges function to handle missing original food data
  const renderChanges = (change: ExtendedFoodChange) => {
    if (!change.original_food) {
      return (
        <Typography color="error">
          Original food details not available. ID: {change.old_version}
        </Typography>
      );
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

    // Return a message if no changes detected
    if (changedFields.length === 0) {
      return <Typography>No changes detected</Typography>;
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

  // Function to load more items
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prevCount) => Math.min(prevCount + 50, updates.length));
      setIsLoadingMore(false);
    }, 300);
  }, [updates.length, isLoadingMore]);

  // Slice the food changes to display only the visible ones
  const visibleFoodChanges = updates.slice(0, visibleCount);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleFoodChanges.length < updates.length
        ) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [accessToken, loadMoreItems, visibleFoodChanges.length, updates.length]);

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
            {visibleFoodChanges.map((change) => (
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
                        Requested by: {change.updated_by || "Unknown User"}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: "text.secondary" }}
                      >
                        Request date:{" "}
                        {change.date
                          ? new Date(change.date).toLocaleDateString()
                          : change.updated_date
                          ? new Date(change.updated_date).toLocaleDateString()
                          : "Unknown date"}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Reason: {change.reason || "No reason provided"}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">
                        Approval Status:
                      </Typography>

                      {/* Add progress tracking */}
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2">
                            {change.new_approved_supervisors_count || 0}/
                            {APPROVAL_CONFIG.REQUIRED_APPROVALS} approvals
                          </Typography>
                          <Typography variant="body2">
                            {APPROVAL_CONFIG.REQUIRED_APPROVALS -
                              (change.new_approved_supervisors_count || 0)}{" "}
                            more needed
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateApprovalPercentage(
                            change.new_approved_supervisors_count || 0
                          )}
                          sx={{
                            height: 8,
                            borderRadius: 5,
                            bgcolor: "rgba(0,0,0,0.1)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: getApprovalProgressColor(
                                change.new_approved_supervisors_count || 0
                              ),
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <UpdateIcon sx={{ mr: 1, color: "#FF8C00" }} />
                        <Typography>
                          {(change.new_approved_supervisors_count || 0) >=
                          APPROVAL_CONFIG.REQUIRED_APPROVALS
                            ? "Fully approved"
                            : `${
                                change.new_approved_supervisors_count || 0
                              } of ${
                                APPROVAL_CONFIG.REQUIRED_APPROVALS
                              } required approvals`}
                        </Typography>
                      </Box>
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
                      disabled={hasUserApproved(change)}
                      sx={{
                        bgcolor: hasUserApproved(change)
                          ? "rgba(255,140,0,0.3)"
                          : "#FF8C00",
                        "&:hover": {
                          bgcolor: hasUserApproved(change)
                            ? "rgba(255,140,0,0.3)"
                            : "#e67e00",
                        },
                        color: "white",
                      }}
                    >
                      {hasUserApproved(change)
                        ? "Already Approved"
                        : (change.new_approved_supervisors_count || 0) >=
                          APPROVAL_CONFIG.REQUIRED_APPROVALS
                        ? "Approval Complete"
                        : "Approve Update"}
                    </Button>
                  </CardActions>

                  {/* Show completion indicator if fully approved */}
                  {(change.new_approved_supervisors_count || 0) >=
                    APPROVAL_CONFIG.REQUIRED_APPROVALS && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "rgba(76, 175, 80, 0.1)",
                        borderTop: "1px solid rgba(76, 175, 80, 0.3)",
                      }}
                    >
                      <Alert
                        icon={<CheckCircleIcon />}
                        severity="success"
                        sx={{ mb: 0 }}
                      >
                        This update has received all required approvals and will
                        be processed
                      </Alert>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Loading indicator for infinite scroll */}
      {visibleFoodChanges.length < updates.length && (
        <Box
          ref={loadMoreRef}
          sx={{
            display: "flex",
            justifyContent: "center",
            py: 4,
          }}
        >
          {isLoadingMore ? (
            <CircularProgress size={30} sx={{ color: "#FF8C00" }} />
          ) : (
            <Button
              variant="outlined"
              onClick={loadMoreItems}
              sx={{ mt: 3, color: "#FF8C00", borderColor: "#FF8C00" }}
            >
              Load More Items
            </Button>
          )}
        </Box>
      )}

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
