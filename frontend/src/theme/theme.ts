import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1B3A6B', // Deep government blue
      light: '#4A5F8F',
      dark: '#0F2844',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2D8659', // Government green
      light: '#52A876',
      dark: '#1F5A3D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFA500', // Amber
      light: '#FFB833',
      dark: '#E67E00',
    },
    error: {
      main: '#D32F2F',
      light: '#E57373',
      dark: '#B71C1C',
    },
    success: {
      main: '#388E3C',
      light: '#66BB6A',
      dark: '#2E7D32',
    },
    info: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#BDBDBD',
    },
    divider: '#E0E0E0',
  },

  typography: {
    fontFamily: '"Roboto", "Helvetica Neue", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontSize: '0.95rem',
          padding: '10px 24px',
          borderRadius: 8,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
          },
        },
        sizeSmall: {
          padding: '6px 16px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '14px 32px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            backgroundColor: '#F5F5F5',
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(27, 58, 107, 0.04)',
          },
        },
      },
    },
  },
});
