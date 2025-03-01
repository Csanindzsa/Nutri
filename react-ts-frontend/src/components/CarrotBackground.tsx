import React, { ReactNode } from "react";
import { Box } from "@mui/material";
import background1 from "../assets/backgrounds/background1.png";
import background2 from "../assets/backgrounds/background2.png";
import background3 from "../assets/backgrounds/background3.png";

interface CarrotBackgroundProps {
  children: ReactNode;
  opacity?: number;
  backgroundSize?: string;
}

const CarrotBackground: React.FC<CarrotBackgroundProps> = ({
  children,
  opacity = 0.15,
  backgroundSize = "cover", // Changed from "200px" to "cover"
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${background2})`,
          backgroundRepeat: "no-repeat", // Changed from "repeat" to "no-repeat"
          backgroundSize: backgroundSize,
          backgroundPosition: "center center", // Added to ensure the image is centered
          opacity,
          zIndex: -1,
        },
      }}
    >
      {children}
    </Box>
  );
};

export default CarrotBackground;
