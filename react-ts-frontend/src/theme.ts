import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      light: '#ffb74d', // lighter orange
      main: '#ff9800', // carrot orange
      dark: '#f57c00', // darker orange
      contrastText: '#fff',
    },
    secondary: {
      light: '#81c784', // light green for health aspect
      main: '#4caf50', // green
      dark: '#388e3c', // dark green
      contrastText: '#fff',
    },
    background: {
      default: '#fff', // white background
      paper: '#f9f9f9', // slightly off-white for cards/paper elements
    },
    text: {
      primary: '#333333', // dark text for readability
      secondary: '#666666', // secondary text
    },
    error: {
      main: '#f44336', // standard error color
    },
    warning: {
      main: '#ff9800', // using orange as warning too for consistency
    },
    info: {
      main: '#2196f3', // standard info blue
    },
    success: {
      main: '#4caf50', // green for success states
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none', // Prevents all-caps buttons
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Slightly rounded corners
  },
  spacing: 8, // Base spacing unit
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28, // More rounded buttons
          padding: '8px 22px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&.Mui-disabled': {
            backgroundColor: '#ffdebc',
            color: '#9e9e9e',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 5px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;