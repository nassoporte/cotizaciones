import { createTheme } from '@mui/material/styles';

// --- Light Theme ---
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4285F4', // Google Blue
    },
    secondary: {
      main: '#8AB4F8', // A lighter, complementary blue
    },
    background: {
      default: '#F6F6F6', // A slightly off-white background
      paper: '#FFFFFF',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
        textTransform: 'none',
        fontWeight: 'bold',
    }
  },
  components: {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 20, // Fully rounded buttons
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            }
        }
    }
  }
});

// --- Dark Theme ---
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8AB4F8', // Light blue for dark mode
    },
    secondary: {
      main: '#4285F4', // Darker blue
    },
    background: {
      default: '#121212', // Standard dark background
      paper: '#1E1E1E',   // Slightly lighter for surfaces
    },
    text: {
        primary: '#E0E0E0',
        secondary: '#B0B0B0',
    }
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    button: {
        textTransform: 'none',
        fontWeight: 'bold',
    }
  },
  components: {
    MuiButton: {
        styleOverrides: {
            root: {
                borderRadius: 20,
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                backgroundColor: '#1E1E1E',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
            }
        }
    }
  }
});
