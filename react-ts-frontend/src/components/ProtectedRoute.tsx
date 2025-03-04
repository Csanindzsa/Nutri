import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

interface ProtectedRouteProps {
  children: React.ReactNode;
  accessToken: string | null;
  checkingAuth: boolean;
  redirectTo?: string;
}

/**
 * Protected route component that checks authentication status
 * Shows loading spinner when checking auth
 * Redirects to specified location if not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  accessToken,
  checkingAuth,
  redirectTo = "/forbidden",
}) => {
  const location = useLocation();

  // Show loading indicator while checking authentication
  if (checkingAuth) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect if not authenticated
  if (!accessToken) {
    // Save the current location so we can redirect after login
    return (
      <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
    );
  }

  // If authenticated, render the children components
  return <>{children}</>;
};

export default ProtectedRoute;
