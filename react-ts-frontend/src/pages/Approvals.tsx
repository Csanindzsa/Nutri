import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Badge,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import UpdateIcon from "@mui/icons-material/Update";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface ApprovalsProps {
  accessToken: string | null;
  userId?: number;
}

// Helper types for our counts
interface ApprovalCounts {
  pendingFoods: number;
  pendingUpdates: number;
  pendingRemovals: number;
  loading: boolean;
  error: string | null;
}

const Approvals: React.FC<ApprovalsProps> = ({ accessToken, userId }) => {
  const navigate = useNavigate();
  const [counts, setCounts] = useState<ApprovalCounts>({
    pendingFoods: 0,
    pendingUpdates: 0,
    pendingRemovals: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchApprovalCounts = async () => {
      if (!accessToken) {
        setCounts((prev) => ({
          ...prev,
          loading: false,
          error: "Authentication required",
        }));
        return;
      }

      try {
        // Fetch pending food approvals
        const foodsResponse = await fetch(
          "http://localhost:8000/foods/approvable/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        // Fetch pending updates
        const updatesResponse = await fetch(
          "http://localhost:8000/food-changes/updates/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        // Fetch pending removals
        const removalsResponse = await fetch(
          "http://localhost:8000/food-changes/deletions/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        // Extract counts from responses
        const pendingFoods = foodsResponse.ok
          ? (await foodsResponse.json()).length
          : 0;
        const pendingUpdates = updatesResponse.ok
          ? (await updatesResponse.json()).length
          : 0;
        const pendingRemovals = removalsResponse.ok
          ? (await removalsResponse.json()).length
          : 0;

        setCounts({
          pendingFoods,
          pendingUpdates,
          pendingRemovals,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching approval counts:", error);
        setCounts((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch approval information",
        }));
      }
    };

    fetchApprovalCounts();
  }, [accessToken]);

  // Navigate to specific approval pages
  const navigateToFoodApprovals = () => {
    navigate("/approvable-foods", { state: { fromApprovals: true } });
  };

  const navigateToUpdateApprovals = () => {
    navigate("/approve-updates", { state: { fromApprovals: true } });
  };

  const navigateToRemovalApprovals = () => {
    navigate("/approve-removals", { state: { fromApprovals: true } });
  };

  if (!accessToken) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Alert severity="warning" sx={{ mt: 4 }}>
          Please log in to access the approvals dashboard.
        </Alert>
      </Container>
    );
  }

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
          Approvals Dashboard
        </Typography>
        <Typography variant="subtitle1">
          Manage pending approvals for foods, updates, and removals
        </Typography>
      </Box>

      {/* Main content */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        {counts.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : counts.error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {counts.error}
          </Alert>
        ) : (
          <Grid container spacing={4}>
            {/* New Foods Approval Card */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    bgcolor: "#e8f4fd",
                    pt: 2,
                    pb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Badge
                      badgeContent={counts.pendingFoods}
                      color="primary"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "1rem",
                          height: "28px",
                          minWidth: "28px",
                          borderRadius: "14px",
                        },
                      }}
                    >
                      <AddCircleIcon
                        sx={{ fontSize: 80, color: "primary.main", mb: 1 }}
                      />
                    </Badge>
                    <Typography
                      variant="h5"
                      align="center"
                      color="primary.main"
                      sx={{ mt: 2 }}
                    >
                      New Foods
                    </Typography>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Review and approve new food items submitted by users. Ensure
                    all details are accurate before approving.
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {counts.pendingFoods} pending approval
                    {counts.pendingFoods !== 1 && "s"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={navigateToFoodApprovals}
                    endIcon={<ArrowForwardIcon />}
                    disabled={counts.pendingFoods === 0}
                  >
                    Review Foods
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Food Updates Approval Card */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    bgcolor: "#fff4e5",
                    pt: 2,
                    pb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Badge
                      badgeContent={counts.pendingUpdates}
                      color="warning"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "1rem",
                          height: "28px",
                          minWidth: "28px",
                          borderRadius: "14px",
                        },
                      }}
                    >
                      <UpdateIcon
                        sx={{ fontSize: 80, color: "warning.main", mb: 1 }}
                      />
                    </Badge>
                    <Typography
                      variant="h5"
                      align="center"
                      color="warning.main"
                      sx={{ mt: 2 }}
                    >
                      Food Updates
                    </Typography>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Review proposed changes to existing food items. Compare the
                    original and updated information before approval.
                  </Typography>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    {counts.pendingUpdates} pending update
                    {counts.pendingUpdates !== 1 && "s"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    color="warning"
                    fullWidth
                    onClick={navigateToUpdateApprovals}
                    endIcon={<ArrowForwardIcon />}
                    disabled={counts.pendingUpdates === 0}
                  >
                    Review Updates
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Food Removals Approval Card */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    bgcolor: "#feebeb",
                    pt: 2,
                    pb: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Badge
                      badgeContent={counts.pendingRemovals}
                      color="error"
                      max={99}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "1rem",
                          height: "28px",
                          minWidth: "28px",
                          borderRadius: "14px",
                        },
                      }}
                    >
                      <DeleteIcon
                        sx={{ fontSize: 80, color: "error.main", mb: 1 }}
                      />
                    </Badge>
                    <Typography
                      variant="h5"
                      align="center"
                      color="error.main"
                      sx={{ mt: 2 }}
                    >
                      Food Removals
                    </Typography>
                  </Box>
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Review requests to remove food items from the database.
                    Check the reason for removal before approving the request.
                  </Typography>
                  <Typography variant="h6" color="error.main" gutterBottom>
                    {counts.pendingRemovals} pending removal
                    {counts.pendingRemovals !== 1 && "s"}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={navigateToRemovalApprovals}
                    endIcon={<ArrowForwardIcon />}
                    disabled={counts.pendingRemovals === 0}
                  >
                    Review Removals
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Approvals;
