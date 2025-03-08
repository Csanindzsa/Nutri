import React, { useState, useEffect, useCallback, useRef } from "react";
import { Food, Ingredient } from "../interfaces";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
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
  Paper,
  Snackbar,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import Slide, { SlideProps } from "@mui/material/Slide";
import { API_BASE_URL } from "../config/environment";

interface ApprovableFoodsProps {
  accessToken: string | null;
  foods: Food[];
  handleApprove: (foodId: number) => void;
}

const ApprovableFoods: React.FC<ApprovableFoodsProps> = ({
  accessToken,
  foods,
  handleApprove,
}) => {
  const [approvableFoods, setApprovableFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Add pagination state
  const [visibleCount, setVisibleCount] = useState(50);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Function for transition effect
  function SlideTransition(props: SlideProps) {
    return <Slide {...props} direction="up" />;
  }

  useEffect(() => {
    // Check authentication - redirect to forbidden instead of showing error
    if (!accessToken) {
      navigate("/forbidden"); // Changed behavior
      return;
    }

    // Check if user came from proper navigation flow
    const fromApprovals =
      location.state && location.state.fromApprovals === true;

    if (!fromApprovals) {
      navigate("/forbidden");
      return;
    }

    // Original data fetching logic
    const fetchApprovableFoods = async () => {
      if (!accessToken) {
        setError("You need to be logged in to access this page");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/foods/approvable/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApprovableFoods(data);
        } else {
          setError("Failed to fetch approvable foods. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching approvable foods:", error);
        setError(
          "An error occurred. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApprovableFoods();
  }, [accessToken, location, navigate]);

  const handleApproveClick = async (foodId: number) => {
    try {
      await handleApprove(foodId);
      // Show success message with our custom UI
      setSuccessMessage("Food approved successfully!");
      // Remove the approved food from the list or mark it as approved
      setApprovableFoods((prevFoods) =>
        prevFoods.filter((food) => food.id !== foodId)
      );
    } catch (error) {
      console.error("Error approving food:", error);
      setApprovalError("Failed to approve food. Please try again.");
    }
  };

  // Function to handle view details
  const handleViewDetails = (foodId: number) => {
    navigate(`/approve-food/${foodId}`);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setApprovalError(null);
  };

  // Function to load more items
  const loadMoreFoods = useCallback(() => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prevCount) =>
        Math.min(prevCount + 50, approvableFoods.length)
      );
      setIsLoadingMore(false);
    }, 300);
  }, [approvableFoods.length, isLoadingMore]);

  // Slice the foods to display only the visible ones
  const visibleFoods = approvableFoods.slice(0, visibleCount);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          visibleFoods.length < approvableFoods.length
        ) {
          loadMoreFoods();
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
  }, [loadMoreFoods, visibleFoods.length, approvableFoods.length]);

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
          Foods Pending Approval
        </Typography>
        <Typography variant="subtitle1">
          Review and approve food items submitted by users
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
        ) : approvableFoods.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No foods currently pending approval
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {visibleFoods.map((food) => (
              <Grid item xs={12} sm={6} md={4} key={food.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: 6,
                    },
                  }}
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
                        {food.restaurant_name}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Approvals: {food.approved_supervisors_count || 0}
                    </Typography>

                    <Box
                      sx={{
                        mt: 2,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {food.is_organic && (
                        <Chip label="Organic" size="small" color="success" />
                      )}
                      {food.is_gluten_free && (
                        <Chip
                          label="Gluten-Free"
                          size="small"
                          color="primary"
                        />
                      )}
                      {food.is_lactose_free && (
                        <Chip
                          label="Lactose-Free"
                          size="small"
                          color="primary"
                        />
                      )}
                      {food.is_alcohol_free && (
                        <Chip
                          label="Alcohol-Free"
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleViewDetails(food.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => handleApproveClick(food.id)}
                      sx={{ ml: "auto" }}
                    >
                      Approve
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Loading indicator for infinite scroll */}
      {visibleFoods.length < approvableFoods.length && (
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
              onClick={loadMoreFoods}
              sx={{ mt: 3, color: "#FF8C00", borderColor: "#FF8C00" }}
            >
              Load More Foods to Approve
            </Button>
          )}
        </Box>
      )}

      {/* Success & error notifications */}
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

      <Snackbar
        open={!!approvalError}
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
          {approvalError}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default ApprovableFoods;
