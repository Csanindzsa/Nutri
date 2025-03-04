/**
 * Helper file for Grid component migration
 * 
 * MUI Grid v1 is deprecated. This file provides guidance on migrating to Grid v2.
 * 
 * How to migrate:
 * 1. Replace import { Grid } from '@mui/material' with:
 *    import Grid from '@mui/material/Unstable_Grid2'
 * 
 * 2. If using TypeScript with props that extend Grid props, use:
 *    import Grid, { Grid2Props } from '@mui/material/Unstable_Grid2'
 * 
 * 3. The API is the same, just with a different import path
 * 
 * See MUI documentation: https://mui.com/material-ui/migration/v5-component-changes/#grid-version-2
 */

// Re-export Grid v2 for easier imports
import Grid2 from '@mui/material/Unstable_Grid2';
export default Grid2;

// Re-export Grid2Props for TypeScript users
export type { Grid2Props } from '@mui/material/Unstable_Grid2';

/**
 * Example usage:
 * 
 * import Grid from '../utils/gridHelpers';
 * 
 * <Grid container spacing={2}>
 *   <Grid xs={12} md={6}>
 *     Content
 *   </Grid>
 * </Grid>
 */
