import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink as RouterNavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// MUI Components
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Box,
    Link,
    ThemeProvider,
    CssBaseline,
    useMediaQuery,
} from '@mui/material';

// Themes
import { lightTheme, darkTheme } from './theme';

// Page Components
import Login from './components/Login';
import Register from './components/Register';
import Clients from './components/Clients';
import Products from './components/Products';
import Quotations from './components/Quotations';
import CreateQuotation from './components/CreateQuotation';
import EditQuotation from './components/EditQuotation';
import Settings from './components/Settings';

// --- Layouts and Protected Routes ---

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

const AppLayout = () => {
    const { logout } = useAuth();
    const activeStyle = {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        <Link component={RouterNavLink} to="/clients" sx={{ textDecoration: 'none', color: 'inherit' }}>
                            Cotizador
                        </Link>
                    </Typography>
                    <Box>
                        <Button
                            color="inherit"
                            component={RouterNavLink}
                            to="/clients"
                            style={({ isActive }) => isActive ? activeStyle : undefined}
                            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            Clientes
                        </Button>
                        <Button
                            color="inherit"
                            component={RouterNavLink}
                            to="/products"
                            style={({ isActive }) => isActive ? activeStyle : undefined}
                            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            Productos
                        </Button>
                        <Button
                            color="inherit"
                            component={RouterNavLink}
                            to="/quotations"
                            style={({ isActive }) => isActive ? activeStyle : undefined}
                            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            Cotizaciones
                        </Button>
                        <Button
                            color="inherit"
                            component={RouterNavLink}
                            to="/settings"
                            style={({ isActive }) => isActive ? activeStyle : undefined}
                            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            Configuración
                        </Button>
                        <Button
                            color="inherit"
                            onClick={logout}
                            sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Outlet /> {/* Nested routes will render here */}
            </Container>
        </Box>
    );
};

// --- Main App Component ---

function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () => (prefersDarkMode ? darkTheme : lightTheme),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
          <Routes>
              {/* Public routes */}
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes with Navbar Layout */}
              <Route element={<ProtectedRoute />}>
                  <Route element={<AppLayout />}>
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/quotations" element={<Quotations />} />
                      <Route path="/quotations/new" element={<CreateQuotation />} />
                      <Route path="/quotations/:id/edit" element={<EditQuotation />} />
                      <Route path="/settings" element={<Settings />} />
                  </Route>
              </Route>

          </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
