import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

interface EditUserProps {
  accessToken: string | null;
  userData: {
    user_id?: number;
    username?: string;
    email?: string;
  };
  setUserData: React.Dispatch<
    React.SetStateAction<{
      user_id?: number;
      username?: string;
      email?: string;
    }>
  >;
  setAccessToken?: React.Dispatch<React.SetStateAction<string | null>>;
  setRefreshToken?: React.Dispatch<React.SetStateAction<string | null>>;
}

const EditUser: React.FC<EditUserProps> = ({
  accessToken,
  userData,
  setUserData,
  setAccessToken,
  setRefreshToken,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Populate form with current user data
    if (userData) {
      setUsername(userData.username || "");
      setEmail(userData.email || "");
    }
  }, [userData]);

  useEffect(() => {
    // Redirect to login if no access token
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (password && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (password && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // Prepare data object
      const updateData: Record<string, string> = {};

      updateData.username = username;
      updateData.email = email;

      // Only include password if it was provided
      if (password) {
        updateData.password = password;
      }

      const response = await fetch("http://localhost:8000/users/edit/", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();

        // Update the user data in the parent component state
        setUserData((prevData) => ({
          ...prevData,
          username: data.user.username,
          email: data.user.email,
        }));

        // Update tokens if provided by API
        if (data.tokens && setAccessToken && setRefreshToken) {
          setAccessToken(data.tokens.access);
          setRefreshToken(data.tokens.refresh);
          localStorage.setItem("access_token", data.tokens.access);
          localStorage.setItem("refresh_token", data.tokens.refresh);
        }

        // Set success message
        setSuccessMessage("Profile updated successfully");

        // Clear password fields after successful update
        setPassword("");
        setConfirmPassword("");

        // Scroll to top to show success message
        window.scrollTo(0, 0);
      } else {
        const errorData = await response.json();
        const newErrors: Record<string, string> = {};

        // Handle validation errors from the backend
        if (errorData.username) {
          newErrors.username = Array.isArray(errorData.username)
            ? errorData.username[0]
            : errorData.username;
        }

        if (errorData.email) {
          newErrors.email = Array.isArray(errorData.email)
            ? errorData.email[0]
            : errorData.email;
        }

        if (errorData.password) {
          newErrors.password = Array.isArray(errorData.password)
            ? errorData.password[0]
            : errorData.password;
        }

        // Handle generic errors
        if (errorData.detail) {
          newErrors.general = errorData.detail;
        }

        setErrors(newErrors);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({
        general: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

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
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Edit Profile
        </Typography>
        <Typography variant="subtitle1">
          Update your account information
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
        {successMessage && (
          <Alert severity="success" sx={{ mb: 4 }}>
            {successMessage}
          </Alert>
        )}

        {errors.general && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {errors.general}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#FF8C00",
                  fontSize: "2.5rem",
                }}
              >
                {userData.username ? userData.username[0].toUpperCase() : "U"}
              </Avatar>
            </Grid>

            {/* User Info Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={!!errors.username}
                    helperText={errors.username || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Password Section */}
            <Grid item xs={12} mt={2}>
              <Typography variant="h6" gutterBottom>
                Change Password (optional)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="password"
                    label="New Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={
                      errors.password ||
                      "Leave blank if you don't want to change your password"
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={!password}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword || ""}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={handleToggleConfirmPasswordVisibility}
                            edge="end"
                            disabled={!password}
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Actions */}
            <Grid
              item
              xs={12}
              sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}
            >
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={isLoading}
                startIcon={
                  isLoading ? <CircularProgress size={20} /> : <SaveIcon />
                }
                sx={{
                  bgcolor: "#FF8C00",
                  "&:hover": {
                    bgcolor: "#e07c00",
                  },
                  px: 4,
                }}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => navigate("/")}
                disabled={isLoading}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
            </Grid>

            {/* Delete Account Link */}
            <Grid item xs={12} sx={{ mt: 4, textAlign: "center" }}>
              <Divider sx={{ mb: 2 }} />
              <Button
                color="error"
                onClick={() => navigate("/delete-user")}
                sx={{ mt: 1 }}
              >
                Delete My Account
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditUser;
