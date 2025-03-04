import React from "react";
import { Grid } from "@mui/material";

/**
 * A safe wrapper for Grid2 that falls back to regular Grid
 * Use this component instead of directly importing Grid or Grid2
 */
const SafeGrid: React.FC<any> = (props) => {
  let Grid2: any;

  try {
    // Try to use the new Grid2
    return <Grid2 {...props} />;
  } catch (e) {
    // Fall back to the regular Grid
    const { item = true, ...otherProps } = props;
    return <Grid item={item} {...otherProps} />;
  }
};

export default SafeGrid;
