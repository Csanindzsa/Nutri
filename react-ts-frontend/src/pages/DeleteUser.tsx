import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Divider,
  CircularProgress,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LockIcon from "@mui/icons-material/Lock";

interface DeleteUserProps {
  accessToken: string | null;
  handleLogout: () => void;
}

const DeleteUser: React.FC<DeleteUserProps> = ({
  accessToken,
  handleLogout,
}) => {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if no access token
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  const handleDelete = async () => {
    setConfirmDialog(false);
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/users/delete/", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        // Clear all auth tokens and user data by calling the logout handler
        handleLogout();

        // Redirect to account-deleted page with state to indicate proper flow
        navigate("/account-deleted", { state: { fromDeletion: true } });
      } else {
        const errorData = await response.json();
        setError(
          errorData.detail || "Failed to delete account. Please try again."
        );
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmation(e.target.value);
    if (error) setError("");
  };

  const openConfirmDialog = (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmation !== "DELETE") {
      setError("Please type DELETE to confirm account deletion");
      return;
    }

    setConfirmDialog(true);
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
          display: "flex",
          alignItems: "center",
        }}
      >
        <DeleteForeverIcon sx={{ fontSize: 32, mr: 2 }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Delete Account
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
        <Alert
          severity="warning"
          variant="outlined"
          icon={<WarningIcon fontSize="large" />}
          sx={{
            mb: 4,
            "& .MuiAlert-icon": { alignItems: "center" },
            border: "2px solid",
            borderColor: "warning.main",
          }}
        >
          <AlertTitle sx={{ fontSize: "1.1rem", fontWeight: "bold" }}>
            This action cannot be undone
          </AlertTitle>
          <Typography variant="body1">
            Deleting your account will permanently remove all your data and
            information from our system, including:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <li>Your personal profile and settings</li>
            <li>Foods you've created or contributed to</li>
            <li>Your approval history and food ratings</li>
          </Box>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={openConfirmDialog} sx={{ mt: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Confirmation
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                To confirm deletion, please type <strong>DELETE</strong> in the
                field below:
              </Typography>
              <TextField
                fullWidth
                value={confirmation}
                onChange={handleConfirmationChange}
                placeholder="Type DELETE to confirm"
                variant="outlined"
                sx={{
                  "& .MuiInputBase-root": {
                    bgcolor: "rgba(255, 255, 255, 0.8)",
                  },
                }}
                disabled={isDeleting}
                error={!!error}
                helperText={error ? error : ""}
              />
            </Box>

            <Divider />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/edit-user")}
                disabled={isDeleting}
              >
                Go Back
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                disabled={isDeleting || confirmation !== "DELETE"}
                sx={{
                  px: 3,
                  py: 1,
                  backgroundColor: "error.dark",
                  "&:hover": {
                    backgroundColor: "error.main",
                  },
                }}
              >
                {isDeleting ? (
                  <>
                    <CircularProgress
                      size={20}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Deleting Account...
                  </>
                ) : (
                  "Permanently Delete Account"
                )}
              </Button>
            </Box>
          </Stack>
        </Box>

        {/* Final Confirmation Dialog */}
        <Dialog
          open={confirmDialog}
          onClose={() => setConfirmDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            elevation: 5,
          }}
        >
          <DialogTitle
            id="alert-dialog-title"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <LockIcon color="error" sx={{ mr: 1 }} />
            Final Confirmation
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              You are about to permanently delete your account. This action{" "}
              <strong>cannot</strong> be undone. Are you absolutely sure you
              want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setConfirmDialog(false)}
              variant="outlined"
              autoFocus
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              startIcon={<DeleteForeverIcon />}
            >
              Delete My Account
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default DeleteUser;
