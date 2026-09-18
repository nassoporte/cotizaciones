import { createTheme } from '@mui/material/styles';

const shared = {
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
    h4:   { fontWeight: 800, letterSpacing: '-0.5px' },
    h5:   { fontWeight: 700 },
    h6:   { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 50, fontWeight: 700, padding: '8px 22px' },
        contained: {
          boxShadow: '0 4px 14px rgba(66,133,244,0.30)',
          '&:hover': { boxShadow: '0 6px 20px rgba(66,133,244,0.42)', transform: 'translateY(-1px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary:    { main: '#4285F4', light: '#6ea6f7', dark: '#1a56db' },
    secondary:  { main: '#8AB4F8' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
    text:       { primary: '#1e293b', secondary: '#64748b' },
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary:    { main: '#6ea6f7', light: '#8AB4F8', dark: '#4285F4' },
    secondary:  { main: '#4285F4' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text:       { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
});
