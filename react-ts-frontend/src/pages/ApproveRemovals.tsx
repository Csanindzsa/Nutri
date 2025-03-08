import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  IconButton,
  Avatar,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Food, Ingredient } from "../interfaces";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // Add this missing import
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/environment";
import {
  APPROVAL_CONFIG,
  calculateApprovalPercentage,
  getApprovalStatusText,
  getApprovalProgressColor,
} from "../config/approvalConfig";
import LinearProgress from "@mui/material/LinearProgress";

interface FoodChange {
  id: number;
  is_deletion: boolean;
  old_version: number; // ID of the food being deleted
  new_name: string; // Original food name
  new_restaurant: number;
  new_restaurant_name: string;
  new_ingredients: number[];
  new_approved_supervisors_count?: number;
  new_approved_supervisors?: number[];
  reason?: string; // Add reason field
  date?: string; // Add date field
  updated_by?: string; // Add who requested the deletion
}

interface ApproveFoodRemovalsProps {
  accessToken: string | null;
  userId: number | undefined;
  ingredients: Ingredient[];
}

const ApproveRemovals: React.FC<ApproveFoodRemovalsProps> = ({
  accessToken,
  userId,
  ingredients,
}) => {
  const [foodChanges, setFoodChanges] = useState<FoodChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Add pagination state
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch food changes that are deletion requests
  useEffect(() => {
    const fetchFoodChanges = async () => {
      if (!accessToken) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.foodChangeDeletions, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch food deletion requests");
        }

        const data = await response.json();
        setFoodChanges(data);
      } catch (err) {
        console.error("Error fetching food deletion requests:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodChanges();
  }, [accessToken, navigate]);

  // Get ingredient names from IDs
  const getIngredientNames = (ingredientIds: number[]): string[] => {
    return ingredientIds.map((id) => {
      const ingredient = ingredients.find((ing) => ing.id === id);
      return ingredient ? ingredient.name : `Unknown Ingredient (ID: ${id})`;
    });
  };

  // Check if the user has already approved this change
  const hasUserApproved = (change: FoodChange): boolean => {
    return change.new_approved_supervisors?.includes(userId as number) || false;
  };

  // Handle approval
  const handleApprove = async (changeId: number) => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.approveRemoval(changeId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to approve food removal");
      }

      // Update the local state
      setFoodChanges((prevChanges) =>
        prevChanges.map((change) =>
          change.id === changeId
            ? {
                ...change,
                new_approved_supervisors_count:
                  (change.new_approved_supervisors_count || 0) + 1,
                new_approved_supervisors: [
                  ...(change.new_approved_supervisors || []),
                  userId as number,
                ],
              }
            : change
        )
      );
    } catch (err) {
      console.error("Error approving food removal:", err);
      setError((err as Error).message);
    }
  };

  // Function to load more items
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prevCount) =>
        Math.min(prevCount + 50, foodChanges.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [foodChanges.length, isLoadingMore]);

  // Slice the food changes to display only the visible ones
  const visibleFoodChanges = foodChanges.slice(0, visibleCount);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleFoodChanges.length < foodChanges.length
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
  }, [loadMoreItems, visibleFoodChanges.length, foodChanges.length]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
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

  if (foodChanges.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">
          There are no pending food removal requests to approve.
        </Alert>
      </Container>
    );
  }

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
          Approve Food Removals
        </Typography>
        <Typography variant="subtitle1">
          Review and approve requests to remove food items from the database
          {foodChanges.length > 0 &&
            ` (${visibleFoodChanges.length}/${foodChanges.length})`}
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        <Grid container spacing={3}>
          {visibleFoodChanges.map((change) => (
            <Grid item xs={12} md={6} lg={4} key={change.id}>
              <Card>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: "#FF8C00" }} aria-label="food">
                      {change.new_name.charAt(0)}
                    </Avatar>
                  }
                  title={`Delete: ${change.new_name}`}
                  subheader={`Restaurant: ${change.new_restaurant_name}`}
                />
                <CardContent>
                  {/* Display the deletion reason */}
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      bgcolor: "rgba(0,0,0,0.03)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary">
                      Reason for deletion:
                    </Typography>
                    <Typography variant="body2">
                      {change.reason || "No reason provided"}
                    </Typography>
                  </Box>

                  {/* Display requester info if available */}
                  {change.updated_by && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Requested by: {change.updated_by}
                      {change.date &&
                        ` on ${new Date(change.date).toLocaleDateString()}`}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    This food has been requested for removal.
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">Ingredients:</Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      {change.new_ingredients &&
                      change.new_ingredients.length > 0 ? (
                        getIngredientNames(change.new_ingredients).map(
                          (name, idx) => (
                            <Chip key={idx} label={name} size="small" />
                          )
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No ingredients listed
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, px: 2 }}>
                    <Typography variant="subtitle2">
                      Approval Status:
                    </Typography>

                    {/* Add progress tracking */}
                    <Box sx={{ mt: 1, mb: 1.5 }}>
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

                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <ThumbUpIcon sx={{ mr: 1, color: "#FF8C00" }} />
                      <Typography>
                        {(change.new_approved_supervisors_count || 0) >=
                        APPROVAL_CONFIG.REQUIRED_APPROVALS
                          ? "Fully approved"
                          : `${change.new_approved_supervisors_count || 0} of ${
                              APPROVAL_CONFIG.REQUIRED_APPROVALS
                            } required approvals`}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ThumbUpIcon />}
                    onClick={() => handleApprove(change.id)}
                    disabled={
                      hasUserApproved(change) ||
                      (change.new_approved_supervisors_count || 0) >=
                        APPROVAL_CONFIG.REQUIRED_APPROVALS
                    }
                    sx={{
                      bgcolor: "#FF8C00",
                      "&:hover": { bgcolor: "#e67e00" },
                      "&.Mui-disabled": {
                        bgcolor: "rgba(255,140,0,0.3)",
                      },
                    }}
                  >
                    {hasUserApproved(change)
                      ? "Approved"
                      : (change.new_approved_supervisors_count || 0) >=
                        APPROVAL_CONFIG.REQUIRED_APPROVALS
                      ? "Complete"
                      : "Approve"}
                  </Button>
                  <IconButton
                    aria-label="view food"
                    onClick={() => navigate(`/food/${change.old_version}`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
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
                      sx={{ mb: 0, fontSize: "0.8rem" }}
                    >
                      This removal has all required approvals
                    </Alert>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Loading indicator for infinite scroll */}
        {visibleFoodChanges.length < foodChanges.length && (
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

        {/* ...existing empty state handling... */}
      </Paper>
    </Container>
  );
};

export default ApproveRemovals;
