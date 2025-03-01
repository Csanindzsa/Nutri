import React from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import LockIcon from "@mui/icons-material/Lock";
import BlockIcon from "@mui/icons-material/Block";

const Forbidden: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      {/* Header with red background for error pages */}
      <Box
        sx={{
          backgroundColor: "#d32f2f", // Error red
          py: 3,
          px: 4,
          borderRadius: "10px 10px 0 0",
          mb: 0,
          color: "white",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          403 - Access Denied
        </Typography>
        <Typography variant="subtitle1">
          You don't have permission to access this page
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            py: 4,
          }}
        >
          {/* Error Icon */}
          <Box sx={{ mb: 4, position: "relative" }}>
            <Box
              sx={{
                position: "relative",
                width: 180,
                height: 180,
                bgcolor: "rgba(211, 47, 47, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LockIcon
                sx={{ fontSize: 100, color: "#d32f2f", opacity: 0.8 }}
              />
            </Box>
            <Box
              sx={{
                position: "absolute",
                right: -10,
                bottom: 20,
                padding: "8px",
                bgcolor: "#fff",
                borderRadius: "50%",
                border: "2px solid #d32f2f",
                width: 50,
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="#d32f2f">
                403
              </Typography>
            </Box>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
            Access to this page is restricted
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 450, mb: 3, mt: 1 }}
          >
            This page can only be accessed through proper application flow, not
            by direct URL navigation.
          </Typography>

          <Stack
            spacing={2}
            direction={{ xs: "column", sm: "row" }}
            sx={{ mt: 3 }}
          >
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              sx={{
                px: 4,
                py: 1.2,
              }}
            >
              Go to Home
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default Forbidden;
