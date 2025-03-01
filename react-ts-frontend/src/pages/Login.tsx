import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  InputAdornment,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

interface LoginProps {
  setAccessToken: React.Dispatch<React.SetStateAction<string | null>>;
  setRefreshToken: React.Dispatch<React.SetStateAction<string | null>>;
  setUserData?: React.Dispatch<
    React.SetStateAction<{
      user_id?: number;
      username?: string;
      email?: string;
    }>
  >;
}

const Login: React.FC<LoginProps> = ({
  setAccessToken,
  setRefreshToken,
  setUserData,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const payload = { email, password };

    try {
      const response = await fetch("http://localhost:8000/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const accessToken = data.access;
        const refreshToken = data.refresh;

        // Store tokens in state and localStorage
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);

        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

        // Set user data if available and the function is provided
        if (setUserData && data.user) {
          setUserData({
            user_id: data.user.id,
            username: data.user.username,
            email: data.user.email,
          });
        }

        // Redirect to home after successful login
        navigate("/");
      } else {
        const data = await response.json();
        setError(data.detail || "Invalid email or password.");
      }
    } catch (err) {
      setError("An error occurred while connecting to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 4, mb: 8 }}>
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
        <Avatar
          sx={{
            mx: "auto",
            mb: 1,
            bgcolor: "rgba(255,255,255,0.2)",
            width: 56,
            height: 56,
          }}
        >
          <LockOutlinedIcon fontSize="large" />
        </Avatar>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Sign In
        </Typography>
        <Typography variant="subtitle1">Access your Nutri account</Typography>
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              bgcolor: "#FF8C00",
              "&:hover": {
                bgcolor: "#e07c00",
              },
            }}
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <LoginIcon />
              )
            }
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          <Grid container sx={{ mt: 2 }}>
            <Grid item xs>
              <Link
                to="/forgot-password"
                style={{ color: "#FF8C00", textDecoration: "none" }}
              >
                <Typography variant="body2" component="span">
                  Forgot password?
                </Typography>
              </Link>
            </Grid>
            <Grid item>
              <Link
                to="/register"
                style={{ color: "#FF8C00", textDecoration: "none" }}
              >
                <Typography variant="body2" component="span">
                  {"Don't have an account? Sign Up"}
                </Typography>
              </Link>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            color="primary"
            sx={{ mb: 1 }}
            startIcon={<PersonAddIcon />}
            component={Link}
            to="/register"
          >
            Create New Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
