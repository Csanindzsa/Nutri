/**
 * Configuration settings for the approval system
 */

export const APPROVAL_CONFIG = {
  // Number of approvals required for food changes to take effect
  REQUIRED_APPROVALS: 10,
  
  // Minimum number of approvals before a change can be considered partially approved
  PARTIAL_APPROVAL_THRESHOLD: 3,
  
  // Settings for approval progress visualization
  PROGRESS_COLORS: {
    low: "#FFC107", // Yellow/amber for low approval count
    medium: "#FF9800", // Orange for medium approval count
    high: "#4CAF50", // Green for high approval count (near completion)
  }
};

/**
 * Calculates approval percentage based on current count and requirement
 */
export const calculateApprovalPercentage = (currentApprovals: number): number => {
  return Math.min(100, Math.round((currentApprovals / APPROVAL_CONFIG.REQUIRED_APPROVALS) * 100));
};

/**
 * Determines approval status text based on current count
 */
export const getApprovalStatusText = (currentApprovals: number): string => {
  const remaining = APPROVAL_CONFIG.REQUIRED_APPROVALS - currentApprovals;
  
  if (currentApprovals >= APPROVAL_CONFIG.REQUIRED_APPROVALS) {
    return "Fully approved";
  } else if (currentApprovals === 0) {
    return `Waiting for ${APPROVAL_CONFIG.REQUIRED_APPROVALS} approvals`;
  } else {
    return `${currentApprovals} approved, ${remaining} more needed`;
  }
};

/**
 * Returns the appropriate color for the approval progress based on count
 */
export const getApprovalProgressColor = (currentApprovals: number): string => {
  const percentage = calculateApprovalPercentage(currentApprovals);
  
  if (percentage >= 100) {
    return "#4CAF50"; // Green for complete
  } else if (percentage >= 70) {
    return "#8BC34A"; // Light green for nearly complete
  } else if (percentage >= 40) {
    return "#FFC107"; // Amber for halfway
  } else {
    return "#FF8C00"; // Orange for early stages
  }
};

/**
 * Checks if a food is fully approved (meets or exceeds the requirement)
 */
export const isFullyApproved = (currentApprovals: number): boolean => {
  return currentApprovals >= APPROVAL_CONFIG.REQUIRED_APPROVALS;
};
