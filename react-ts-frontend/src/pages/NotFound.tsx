import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  SvgIcon,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const NotFound: React.FC = () => {
  const location = useLocation();

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
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          404 - Page Not Found
        </Typography>
        <Typography variant="subtitle1">
          The page you're looking for doesn't exist
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
                bgcolor: "rgba(255, 140, 0, 0.1)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ErrorOutlineIcon
                sx={{ fontSize: 100, color: "#FF8C00", opacity: 0.8 }}
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
                border: "2px solid #FF8C00",
                width: 50,
                height: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" fontWeight="bold" color="#FF8C00">
                404
              </Typography>
            </Box>
          </Box>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 500 }}>
            Oops! This page is on a diet
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 450, mb: 3, mt: 1 }}
          >
            We couldn't find the page you're looking for. The URL{" "}
            <Typography component="span" sx={{ fontWeight: "bold" }}>
              {location.pathname}
            </Typography>{" "}
            doesn't exist on our server.
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
                bgcolor: "#FF8C00",
                "&:hover": { bgcolor: "#e67e00" },
              }}
            >
              Go to Home Page
            </Button>
            <Button
              component={Link}
              to="/foods"
              variant="outlined"
              size="large"
              startIcon={<SearchIcon />}
              sx={{ px: 4, py: 1.2 }}
            >
              Browse Foods
            </Button>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 8, fontStyle: "italic" }}
          >
            If you believe this is an error, please contact our support team
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;
