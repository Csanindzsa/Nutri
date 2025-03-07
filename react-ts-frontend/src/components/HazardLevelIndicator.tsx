import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { getHazardLabel } from "../utils/hazardUtils";

interface HazardLevelIndicatorProps {
  hazardLevel?: number;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
}

const HazardLevelIndicator: React.FC<HazardLevelIndicatorProps> = ({
  hazardLevel = 0,
  size = "medium",
  showLabel = true,
}) => {
  // Use the exact hazard level without rounding for more precision
  const level = hazardLevel || 0;
  // Calculate percentage for the gradient position (0-100%)
  const percentage = Math.min(100, (level / 4) * 100);

  // Get a descriptive label for the tooltip
  const label = getHazardLabel(Math.round(level));

  // Define sizes based on the size prop
  const heights = {
    small: 4,
    medium: 8,
    large: 12,
  };

  const fontSize = {
    small: "0.6rem",
    medium: "0.7rem",
    large: "0.8rem",
  };

  const markerSize = {
    small: 8,
    medium: 12,
    large: 16,
  };

  const barHeight = heights[size];
  const dotSize = markerSize[size];

  return (
    <Box>
      {showLabel && (
        <Typography
          variant="caption"
          component="div"
          sx={{
            mb: 0.5,
            fontSize: fontSize[size],
            color: "text.secondary",
          }}
        >
          Hazard Level
        </Typography>
      )}
      <Tooltip title={`${label} (Level ${level.toFixed(1)})`}>
        <Box sx={{ position: "relative", mt: dotSize / 4 }}>
          {/* Gradient background bar */}
          <Box
            sx={{
              height: barHeight,
              borderRadius: barHeight / 2,
              background:
                "linear-gradient(to right, #4CAF50, #8BC34A, #FFEB3B, #F44336, #9C27B0)",
              position: "relative",
              overflow: "hidden",
            }}
          />

          {/* Position marker/indicator on the gradient */}
          <Box
            sx={{
              position: "absolute",
              left: `calc(${percentage}% - ${dotSize / 2}px)`,
              top: -(dotSize / 2 - barHeight / 2),
              width: dotSize,
              height: dotSize,
              borderRadius: "50%",
              backgroundColor: "white",
              border: "2px solid #333",
              boxShadow: "0px 2px 4px rgba(0,0,0,0.3)",
            }}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default HazardLevelIndicator;
