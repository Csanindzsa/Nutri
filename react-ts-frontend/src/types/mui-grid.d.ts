/**
 * Type declarations for @mui/material/Unstable_Grid2
 */

declare module '@mui/material/Unstable_Grid2' {
  import * as React from 'react';
  import { SystemProps } from '@mui/system';
  import { Theme } from '@mui/material/styles';
  
  export interface Grid2Props extends SystemProps<Theme> {
    children?: React.ReactNode;
    columns?: number;
    columnSpacing?: number | string;
    container?: boolean;
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    item?: boolean;
    rowSpacing?: number | string;
    spacing?: number | string;
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    zeroMinWidth?: boolean;
    xs?: number | 'auto' | boolean;
    sm?: number | 'auto' | boolean;
    md?: number | 'auto' | boolean;
    lg?: number | 'auto' | boolean;
    xl?: number | 'auto' | boolean;
  }
  
  declare const Grid2: React.FC<Grid2Props>;
  export default Grid2;
}
