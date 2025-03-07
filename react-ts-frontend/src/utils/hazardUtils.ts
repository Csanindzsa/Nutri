/**
 * Utility functions for handling hazard levels
 */

/**
 * Get the appropriate color for a hazard level
 * For gradient support, we'll return colors along the spectrum
 */
export const getHazardColor = (level: number): string => {
  // For discrete levels (rounded)
  const roundedLevel = Math.round(level);
  switch (roundedLevel) {
    case 0: return "#4CAF50"; // Green
    case 1: return "#8BC34A"; // Light Green
    case 2: return "#FFEB3B"; // Yellow
    case 3: return "#F44336"; // Red
    case 4: return "#9C27B0"; // Purple
    default: return "#CCCCCC"; // Gray for undefined
  }
};

/**
 * Get the interpolated color along the hazard gradient
 * This function returns a color at any point along the gradient based on exact level
 */
export const getInterpolatedColor = (level: number): string => {
  // Ensure level is within bounds
  const clampedLevel = Math.max(0, Math.min(4, level));
  
  // Define color stops for our gradient
  const colorStops = [
    { level: 0, color: [76, 175, 80] },    // Green
    { level: 1, color: [139, 195, 74] },   // Light Green
    { level: 2, color: [255, 235, 59] },   // Yellow
    { level: 3, color: [244, 67, 54] },    // Red
    { level: 4, color: [156, 39, 176] }    // Purple
  ];
  
  // Find the two color stops we need to interpolate between
  let lowerStop = colorStops[0];
  let upperStop = colorStops[4];
  
  for (let i = 0; i < colorStops.length - 1; i++) {
    if (clampedLevel >= colorStops[i].level && clampedLevel <= colorStops[i+1].level) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i+1];
      break;
    }
  }
  
  // Calculate how far between the two stops our level is (0-1)
  const range = upperStop.level - lowerStop.level;
  const normalizedPosition = range === 0 ? 0 : (clampedLevel - lowerStop.level) / range;
  
  // Interpolate RGB values
  const r = Math.round(lowerStop.color[0] + normalizedPosition * (upperStop.color[0] - lowerStop.color[0]));
  const g = Math.round(lowerStop.color[1] + normalizedPosition * (upperStop.color[1] - lowerStop.color[1]));
  const b = Math.round(lowerStop.color[2] + normalizedPosition * (upperStop.color[2] - upperStop.color[2]));
  
  return `rgb(${r}, ${g}, ${b})`;
};

/**
 * Get a descriptive label for a hazard level
 */
export const getHazardLabel = (level: number): string => {
  const roundedLevel = Math.round(level);
  switch (roundedLevel) {
    case 0: return "Safe";
    case 1: return "Minimal Risk";
    case 2: return "Mild Risk";
    case 3: return "Moderate Risk";
    case 4: return "High Risk";
    default: return "Unknown Risk";
  }
};

/**
 * Get a percentage value (0-100) representing the hazard level
 */
export const getHazardPercentage = (level: number): number => {
  return Math.min(100, (level / 4) * 100);
};
