import React, { ReactNode } from "react";
import { Paper, PaperProps } from "@mui/material";

interface EnhancedPaperProps extends PaperProps {
  children: ReactNode;
}

/**
 * Enhanced Paper component that provides better readability against the background
 * by using higher opacity and a subtle blur effect
 */
const EnhancedPaper: React.FC<EnhancedPaperProps> = ({
  children,
  sx,
  ...props
}) => {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "rgba(255,255,255,0.92)", // More opaque background
        backdropFilter: "blur(3px)", // Slight blur effect for better readability
        boxShadow: "0px 3px 10px rgba(0,0,0,0.1)",
        ...sx,
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default EnhancedPaper;
