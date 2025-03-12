import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import HomeIcon from "@mui/icons-material/Home";
import LoginIcon from "@mui/icons-material/Login";
import {API_BASE_URL} from "../config/environment";

const ConfirmEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("got token: ", token)

  // Function to handle email confirmation request
  const confirmEmail = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/confirm-email/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
        }),
      });

      if (response.ok) {
        setMessage(
          "Congratulations! Your email has been successfully verified."
        );
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => navigate("/login"), 3000);
      } else {
        const data = await response.json();
        setError(
          data.detail ||
            "Invalid or expired confirmation link. Please request a new one."
        );
        setIsSuccess(false);
      }
    } catch (error) {
      setError(
        "An error occurred while verifying your email. Please try again later."
      );
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Confirm the email when the component mounts
    if (token) {
      confirmEmail();
    } else {
      setError("Invalid confirmation link. Token is missing.");
      setIsLoading(false);
    }
  }, [token]);

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
          <MarkEmailReadIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 600, textAlign: "center" }}
        >
          Email Verification
        </Typography>
        <Typography variant="subtitle1" sx={{ textAlign: "center" }}>
          Confirming your email address
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
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                my: 4,
              }}
            >
              <CircularProgress size={60} sx={{ color: "#FF8C00", mb: 3 }} />
              <Typography variant="h6" color="text.secondary">
                Verifying your email address...
              </Typography>
            </Box>
          ) : isSuccess ? (
            <>
              <CheckCircleOutlineIcon
                sx={{
                  fontSize: 80,
                  color: "success.main",
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                color="text.primary"
                sx={{ fontWeight: 500 }}
              >
                {message}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                You will be redirected to the login page in a moment...
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
                    to="/login"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<LoginIcon />}
                    sx={{
                      py: 1.5,
                      bgcolor: "#FF8C00",
                      "&:hover": { bgcolor: "#e67e00" },
                    }}
                  >
                    Go to Login
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button
                    component={Link}
                    to="/"
                    variant="outlined"
                    color="primary"
                    fullWidth
                    size="large"
                    startIcon={<HomeIcon />}
                    sx={{ py: 1.5 }}
                  >
                    Back to Home
                  </Button>
                </Grid>
              </Grid>
            </>
          ) : (
            <>
              <ErrorOutlineIcon
                sx={{
                  fontSize: 80,
                  color: "error.main",
                  mb: 2,
                }}
              />
              <Typography
                variant="h5"
                gutterBottom
                color="text.primary"
                sx={{ fontWeight: 500 }}
              >
                Email Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 4, textAlign: "left" }}>
                {error}
              </Alert>
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
              </Grid>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ConfirmEmail;
