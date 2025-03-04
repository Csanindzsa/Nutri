import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  SelectChangeEvent, // Import the correct type for Select onChange
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { sendEmail, EmailData } from "../utils/emailService";

interface SupportProps {
  accessToken: string | null;
  userData: {
    user_id?: number;
    username?: string;
    email?: string;
  };
}

const Support: React.FC<SupportProps> = ({ accessToken, userData }) => {
  const navigate = useNavigate();
  // Form state
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [userEmail, setUserEmail] = useState(userData.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Support categories
  const supportCategories = [
    { value: "general", label: "General Question" },
    { value: "account", label: "Account Issues" },
    { value: "foods", label: "Food Data Questions" },
    { value: "restaurants", label: "Restaurant Information" },
    { value: "bug", label: "Report a Bug" },
    { value: "feature", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  // Fixed handler for Select component - using the correct type
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategory(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!subject.trim() || !message.trim() || !userEmail.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    // Email validation
    if (!validateEmail(userEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const emailData: EmailData = {
      subject,
      message,
      category,
      userName: userData.username || "Anonymous User",
      userEmail,
    };

    try {
      // Send the email using our email service
      const result = await sendEmail(emailData);

      if (result) {
        setSuccess(true);
        setFormSubmitted(true);

        // Clear form after successful submission
        setSubject("");
        setMessage("");
        setCategory("general");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending support request:", err);
      setError(
        "Failed to send your message. Please try again or contact us directly."
      );
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const handleClose = () => {
    setSuccess(false);
    setError(null);
  };

  const handleSendAnother = () => {
    setFormSubmitted(false);
    setSubject("");
    setMessage("");
    setCategory("general");
    setSuccess(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Header */}
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
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 36, mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Support Center
          </Typography>
          <Typography variant="subtitle1">
            How can we help you today?
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: "0 0 10px 10px",
          bgcolor: "rgba(255,255,255,0.95)",
        }}
      >
        {formSubmitted ? (
          <Box textAlign="center" py={4}>
            <Avatar
              sx={{
                bgcolor: "success.light",
                width: 80,
                height: 80,
                margin: "0 auto 20px",
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 50, color: "white" }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              Message Sent Successfully!
            </Typography>
            <Typography variant="body1" paragraph>
              Thank you for contacting us. We've received your message and will
              get back to you at {userEmail} as soon as possible.
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              <Grid item xs={12} sm={6} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSendAnother}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    bgcolor: "#FF8C00",
                    "&:hover": { bgcolor: "#e67e00" },
                  }}
                >
                  Send Another Message
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Typography paragraph>
              Have a question, suggestion, or need assistance? Fill out the form
              below and we'll get back to you as soon as possible.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      value={category}
                      label="Category"
                      onChange={handleCategoryChange}
                    >
                      {supportCategories.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    variant="outlined"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    variant="outlined"
                    placeholder="Please describe your issue or question in detail..."
                  />
                </Grid>

                {/* Email field - populated with user's email if logged in, but still editable */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Your Email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    variant="outlined"
                    placeholder="Enter your email address for a reply"
                    required
                    helperText="We'll use this email to respond to your inquiry"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SendIcon />
                      )
                    }
                    disabled={loading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      bgcolor: "#FF8C00",
                      "&:hover": { bgcolor: "#e67e00" },
                      width: { xs: "100%", sm: "auto" },
                    }}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </>
        )}
      </Paper>

      {/* Success snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography>Message sent successfully!</Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Support;
