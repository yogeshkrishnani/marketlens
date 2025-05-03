import { createTheme, Theme, PaletteMode } from '@mui/material';

// Custom colors for financial data
export const financialColors = {
  // Market data colors
  positive: '#00897B', // Green for positive changes
  negative: '#E53935', // Red for negative changes
  neutral: '#757575', // Gray for neutral or no change

  // UI colors
  primary: '#F05A28', // Orange primary color
  secondary: '#2E7CD1', // Blue for secondary actions

  // Chart colors
  chart: {
    primary: '#F05A28', // Orange
    secondary: '#2E7CD1', // Blue
    tertiary: '#00897B', // Green
    quaternary: '#9C27B0', // Purple
  },
};

// Custom theme tokens
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode
          primary: {
            main: financialColors.primary,
          },
          secondary: {
            main: financialColors.secondary,
          },
          background: {
            default: '#F5F7FA',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
          },
        }
      : {
          // Dark mode
          primary: {
            main: '#4B94EA', // Lighter blue for dark mode
          },
          secondary: {
            main: '#FF7043', // Lighter orange for dark mode
          },
          background: {
            default: '#121212',
            paper: '#1E1E1E',
          },
          text: {
            primary: '#E0E0E0',
            secondary: '#AEAEAE',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
});

// Create theme function that uses the current mode
export const createAppTheme = (mode: PaletteMode): Theme => {
  // First create a base theme with the design tokens
  const baseTheme = createTheme(getDesignTokens(mode));

  // Then augment the theme with component overrides
  return createTheme(baseTheme, {
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
            color: mode === 'light' ? '#212121' : '#E0E0E0',
            boxShadow: 'none',
            borderBottom: `1px solid ${mode === 'light' ? '#E0E0E0' : '#424242'}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow:
              mode === 'light' ? '0 2px 8px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.2)',
            border: `1px solid ${mode === 'light' ? '#E0E0E0' : '#424242'}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'light' ? '0 2px 8px rgba(0,0,0,0.05)' : '0 2px 8px rgba(0,0,0,0.2)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'light' ? '#E0E0E0' : '#424242'}`,
          },
        },
      },
    },
  });
};
