import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  Divider,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HomeIcon from "@mui/icons-material/Home";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

const AccountDeleted: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user arrived via proper deletion flow
  const isAuthorizedAccess =
    location.state && location.state.fromDeletion === true;

  useEffect(() => {
    // If accessed directly, redirect to forbidden page
    if (!isAuthorizedAccess) {
      navigate("/forbidden");
    }
  }, [isAuthorizedAccess, navigate]);

  // If not authorized, render nothing while redirecting
  if (!isAuthorizedAccess) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
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
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            width: 60,
            height: 60,
            mb: 2,
          }}
        >
          <CheckCircleOutlineIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, textAlign: "center" }}
        >
          Account Successfully Deleted
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
          Your data has been permanently removed from our system
        </Typography>
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
        <Box sx={{ textAlign: "center", py: 3 }}>
          <DeleteForeverIcon
            sx={{
              fontSize: 80,
              color: "error.light",
              opacity: 0.7,
              mb: 2,
            }}
          />

          <Typography
            variant="h5"
            gutterBottom
            color="text.primary"
            sx={{ fontWeight: 500 }}
          >
            Your account has been successfully deleted
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: "auto", mb: 4 }}
          >
            All personal information, contributions, and preferences have been
            removed from our database. Thank you for using Nutri.
          </Typography>

          <Divider sx={{ my: 4 }} />

          <Typography
            variant="h6"
            gutterBottom
            color="text.primary"
            sx={{ mt: 3 }}
          >
            What would you like to do next?
          </Typography>

          <Grid
            container
            spacing={3}
            justifyContent="center"
            sx={{ mt: 2, maxWidth: 600, mx: "auto" }}
          >
            <Grid item xs={12} sm={6}>
              <Button
                component={Link}
                to="/"
                variant="contained"
                fullWidth
                size="large"
                startIcon={<HomeIcon />}
                sx={{
                  py: 1.5,
                  bgcolor: "#FF8C00",
                  "&:hover": { bgcolor: "#e67e00" },
                }}
              >
                Return to Home
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                color="primary"
                fullWidth
                size="large"
                startIcon={<PersonAddIcon />}
                sx={{ py: 1.5 }}
              >
                Create New Account
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            If you believe this was done in error or you need assistance, please
            contact our support team.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AccountDeleted;
