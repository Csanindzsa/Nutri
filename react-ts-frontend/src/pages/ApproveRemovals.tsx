import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FoodChange, Ingredient, Food } from "../interfaces";
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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import Slide, { SlideProps } from "@mui/material/Slide";

interface ApproveRemovalsProps {
  accessToken: string | null;
  userId?: number;
  ingredients: Ingredient[];
}

// Function for transition effect
function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

const ApproveRemovals: React.FC<ApproveRemovalsProps> = ({
  accessToken,
  userId,
  ingredients,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [removals, setRemovals] = useState<FoodChange[]>([]);
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

    // Then check authentication - redirect to forbidden instead of showing error
    if (!accessToken || !userId) {
      navigate("/forbidden"); // Changed from setting error to redirect
      return;
    }

    // Original fetch logic
    fetchRemovals();
  }, [accessToken, userId, location, navigate]);

  const fetchRemovals = async () => {
    // Check for both accessToken and userId to confirm user is authenticated
    if (!accessToken || !userId) {
      setError("You need to be logged in to access this page");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8000/food-changes/deletions/",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRemovals(data);
      } else if (response.status === 401) {
        // Add specific handling for unauthorized status
        setError("Your session has expired. Please log in again.");
        // You could also redirect to login page here
      } else {
        setError("Failed to fetch food removal requests");
      }
    } catch (error) {
      console.error("Error fetching food removals:", error);
      setError("An error occurred while fetching removal requests");
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

  const handleApproveRemoval = async (changeId: number) => {
    if (!accessToken) {
      setErrorMessage("You need to be logged in to approve removals");
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
        // Remove the approved change from the list
        setRemovals((prev) => prev.filter((change) => change.id !== changeId));
        setSuccessMessage("Food removal approved successfully");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to approve removal");
      }
    } catch (error) {
      console.error("Error approving removal:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const handleRejectRemoval = async (changeId: number) => {
    if (!accessToken) {
      setErrorMessage("You need to be logged in to reject removals");
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
        // Remove the rejected change from the list
        setRemovals((prev) => prev.filter((change) => change.id !== changeId));
        setSuccessMessage("Food removal rejected successfully");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Failed to reject removal");
      }
    } catch (error) {
      console.error("Error rejecting removal:", error);
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
        handleApproveRemoval(confirmDialog.changeId);
      } else {
        handleRejectRemoval(confirmDialog.changeId);
      }
      handleCloseConfirm();
    }
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
          Food Removal Requests
        </Typography>
        <Typography variant="subtitle1">
          Review and approve requests to remove food items
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
        ) : removals.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No food removal requests pending approval
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {removals.map((change) => {
              const food = change.food as Food;
              return (
                <Grid item xs={12} md={6} key={change.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Box sx={{ position: "relative" }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={
                          food?.image ||
                          "https://via.placeholder.com/300x140?text=No+Image"
                        }
                        alt={food?.name}
                        sx={{ filter: "grayscale(80%)" }}
                      />
                      <Chip
                        label="Removal Requested"
                        color="error"
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          fontWeight: "bold",
                        }}
                      />
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {food?.name}
                      </Typography>

                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <RestaurantIcon
                          sx={{ color: "text.secondary", mr: 1, fontSize: 18 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {food?.restaurant_name}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mt: 2 }}
                      >
                        Reason for removal:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, color: "text.secondary" }}
                      >
                        {change.reason || "No reason provided"}
                      </Typography>

                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 2 }}
                      >
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
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        startIcon={<VisibilityIcon />}
                        href={`/food/${food?.id}`}
                        target="_blank"
                        rel="noopener"
                      >
                        View Food
                      </Button>

                      <Box sx={{ flexGrow: 1 }} />

                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleOpenConfirm(change.id, "approve")}
                      >
                        Approve Removal
                      </Button>

                      <Button
                        size="small"
                        color="primary"
                        startIcon={<CancelOutlinedIcon />}
                        onClick={() => handleOpenConfirm(change.id, "reject")}
                      >
                        Reject
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
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
            ? "Confirm Food Removal"
            : "Reject Removal Request"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.action === "approve"
              ? "Are you sure you want to approve this food removal? This will permanently remove the food item from the database."
              : "Are you sure you want to reject this removal request? The food item will remain in the database."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.action === "approve" ? "error" : "primary"}
            autoFocus
          >
            {confirmDialog.action === "approve"
              ? "Approve Removal"
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

export default ApproveRemovals;
