import React, { useState, useEffect } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Link,
  CircularProgress,
  Grid, // Regular Grid as backup
} from "@mui/material";
// Try to import Grid, fallback to regular Grid (handled in render)


import { API_ENDPOINTS } from "../config/environment";
import { styled } from "@mui/material/styles";
import decodeToken from "../utils/decodeToken";

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  borderRadius: "10px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(6),
  },
}));

interface LoginProps {
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setUserData: (userData: any) => void;
}

const Login: React.FC<LoginProps> = ({
  setAccessToken,
  setRefreshToken,
  setUserData,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get the page they were trying to access before being redirected
  const from = location.state?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Clear any errors when inputs change
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const {
        access,
        refresh,
        user_id,
        username,
        email: userEmail,
      } = await response.json();

      // Save tokens in localStorage for persistence
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);

      
      

      // Update state
      setAccessToken(access);
      setRefreshToken(refresh);
      const decoded = decodeToken(access);
      if (decoded){ //must exist at this point
        setUserData({
          user_id: decoded.user_id,
          username: decoded.username,
          email: decoded.email,
          is_supervisor: decoded.is_supervisor
        });
      }
      

      // Navigate to the page they were trying to access
      navigate(from);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      {/* Header section */}
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
          Log In
        </Typography>
        <Typography variant="subtitle1">
          Welcome back! Please enter your credentials.
        </Typography>
      </Box>

      <FormPaper sx={{ borderRadius: "0 0 10px 10px" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, width: "100%" }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={submitting}
                sx={{
                  py: 1.5,
                  backgroundColor: "#FF8C00",
                  "&:hover": { backgroundColor: "#e67e00" },
                  borderRadius: 2,
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </Grid>

            <Grid item xs={12} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{" "}
                <Link component={RouterLink} to="/register" variant="body2">
                  Sign up
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </FormPaper>
    </Container>
  );
};

export default Login;
