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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    // Basic validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsSubmitting(false);
      return;
    }

    const payload = { email, password, username };

    try {
      const response = await fetch("http://localhost:8000/create-user/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessMessage(
          "Registration successful! Please check your email to confirm your account."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        const data = await response.json();
        if (data.username) {
          setError(`Username error: ${data.username[0]}`);
        } else if (data.email) {
          setError(`Email error: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Password error: ${data.password[0]}`);
        } else {
          setError(data.detail || "An error occurred while creating the user.");
        }
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
          <PersonAddIcon fontSize="large" />
        </Avatar>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Sign Up
        </Typography>
        <Typography variant="subtitle1">
          Create an account to use Nutri
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Password must be at least 8 characters long"
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
                <PersonAddIcon />
              )
            }
          >
            {isSubmitting ? "Registering..." : "Register"}
          </Button>

          <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
            <Grid item>
              <Link
                to="/login"
                style={{ color: "#FF8C00", textDecoration: "none" }}
              >
                <Typography variant="body2" component="span">
                  {"Already have an account? Sign In"}
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
            startIcon={<LoginIcon />}
            component={Link}
            to="/login"
          >
            Sign In to Existing Account
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
