# Grid Deprecation Fixes

MUI has deprecated the Grid component from `@mui/material/Grid` in favor of `@mui/material/Unstable_Grid2`.

## How to Fix Grid Deprecation Warning

### Option 1: Directly import Grid2 (recommended)

```tsx
// Replace this:
import { Grid } from "@mui/material";

// With this:
import Grid from "@mui/material/Unstable_Grid2";
```

### Option 2: Use the helper from utils/gridHelpers.ts

We've created a helper file to make the migration easier:

```tsx
// Import Grid from the helper
import Grid from "../utils/gridHelpers";

// Then use it as normal
<Grid container spacing={2}>
  <Grid xs={12} md={6}>
    Content
  </Grid>
</Grid>;
```

### Option 3: Global search and replace

Search for:

```
import { Grid
```

or

```
import Grid from '@mui/material/Grid'
```

Replace with:

```
import Grid from '@mui/material/Unstable_Grid2'
```

## Examples

### Before

```tsx
import { Grid, Typography } from "@mui/material";

<Grid container spacing={2}>
  <Grid item xs={12}>
    <Typography>Hello World</Typography>
  </Grid>
</Grid>;
```

### After

```tsx
import Grid from "@mui/material/Unstable_Grid2";
import { Typography } from "@mui/material";

<Grid container spacing={2}>
  <Grid xs={12}>
    <Typography>Hello World</Typography>
  </Grid>
</Grid>;
```

## Key Differences

1. Grid v2 doesn't need the `item` prop - it's implied when not using `container`
2. Styles are more consistent and predictable
3. Better support for responsive layouts

For more info, see [MUI documentation on Grid v2](https://mui.com/material-ui/migration/v5-component-changes/#grid-version-2)
