import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink as RouterNavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import apiClient from './api/axios';

// MUI
import {
    Box, ThemeProvider, CssBaseline, useMediaQuery, useTheme,
    IconButton, Drawer, Tooltip, Typography, Avatar,
} from '@mui/material';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

// Themes
import { lightTheme, darkTheme } from './theme';

// Pages
import Login from './components/Login';
import Register from './components/Register';
import Clients from './components/Clients';
import Products from './components/Products';
import Quotations from './components/Quotations';
import CreateQuotation from './components/CreateQuotation';
import EditQuotation from './components/EditQuotation';
import Settings from './components/Settings';

// ------------------------------------------------
// PROTECTED ROUTE
// ------------------------------------------------
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

// ------------------------------------------------
// NAV ITEMS
// ------------------------------------------------
const NAV_ITEMS = [
    { text: 'Clientes',      path: '/clients',    icon: <PeopleIcon /> },
    { text: 'Productos',     path: '/products',   icon: <InventoryIcon /> },
    { text: 'Cotizaciones',  path: '/quotations', icon: <DescriptionIcon /> },
    { text: 'Configuración', path: '/settings',   icon: <SettingsIcon /> },
];

const SIDEBAR_W = 230;

// ------------------------------------------------
// SIDEBAR CONTENT
// ------------------------------------------------
const SidebarContent = ({ onClose }) => {
    const { logout, appConfig } = useAuth();
    const theme = useTheme();
    const BASE_URL = apiClient.defaults.baseURL || 'http://127.0.0.1:8000';

    const linkBase = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '11px 18px',
        borderRadius: '12px',
        textDecoration: 'none',
        color: theme.palette.text.secondary,
        fontSize: '0.95rem',
        fontWeight: 600,
        transition: 'all 0.18s',
        margin: '2px 0',
    };

    const activeStyle = {
        ...linkBase,
        background: theme.palette.mode === 'dark'
            ? 'rgba(66,133,244,0.18)'
            : 'rgba(66,133,244,0.10)',
        color: theme.palette.primary.main,
    };

    return (
        <Box sx={{
            width: SIDEBAR_W,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            overflow: 'hidden',
        }}>
            {/* Logo / Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, px: 1, pt: 1 }}>
                {appConfig?.logo_app_url ? (
                    <img
                        src={`${BASE_URL}/logos/${appConfig.logo_app_url}`}
                        alt="Logo"
                        style={{ maxHeight: 70, objectFit: 'contain' }}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 38, height: 38,
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #4285F4, #1a56db)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(66,133,244,0.35)',
                            flexShrink: 0,
                        }}>
                            <ReceiptLongIcon sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>
                            Cotizador
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Navigation links */}
            <Box sx={{ flex: 1 }}>
                {NAV_ITEMS.map((item) => (
                    <RouterNavLink
                        key={item.text}
                        to={item.path}
                        style={({ isActive }) => isActive ? activeStyle : linkBase}
                        onClick={onClose}
                    >
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 32, height: 32, borderRadius: '8px',
                            background: 'transparent',
                            '& svg': { fontSize: 20 },
                        }}>
                            {item.icon}
                        </Box>
                        {item.text}
                    </RouterNavLink>
                ))}
            </Box>

            {/* Bottom Sidebar: Cerrar Sesión only */}
            <Box sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 2, mt: 2,
            }}>
                <Box
                    onClick={logout}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '11px 18px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: theme.palette.error.main,
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        transition: 'background 0.2s',
                        '&:hover': {
                            background: theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)',
                        }
                    }}
                >
                    <LogoutIcon fontSize="small" />
                    Cerrar Sesión
                </Box>
            </Box>
        </Box>
    );
};

// ------------------------------------------------
// TOP BAR (User Profile on Top Right)
// ------------------------------------------------
const TopBar = () => {
    const { account, theme, toggleTheme } = useAuth();
    const muiTheme = useTheme();

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 2,
            px: { xs: 2, md: 4 },
            py: 1.5,
            background: 'transparent',
            position: 'relative',
        }}>
            {/* Título centrado */}
            <Typography sx={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                fontWeight: 800,
                fontSize: '1.15rem',
                letterSpacing: '-0.3px',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                color: muiTheme.palette.text.primary,
                display: { xs: 'none', md: 'block' },
            }}>
                Cotizador
            </Typography>

            {/* Toggle de tema */}
            <IconButton onClick={toggleTheme} color="inherit" size="small">
                {theme === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </IconButton>

            {/* Perfil del usuario */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{
                    width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #4285F4, #1a56db)',
                }}>
                    {account?.full_name?.[0]?.toUpperCase() || account?.username?.[0]?.toUpperCase() || '?'}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography variant="body2" fontWeight={700}>
                        {account?.full_name || account?.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: -0.2 }}>
                        {account?.role === 'admin' ? 'Administrador' : 'Usuario'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

// ------------------------------------------------
// APP LAYOUT (Sidebar + Content)
// ------------------------------------------------
const AppLayout = () => {
    const theme = useTheme();
    const { appConfig } = useAuth();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const BASE_URL = apiClient.defaults.baseURL || 'http://127.0.0.1:8000';

    const sidebarSx = {
        width: SIDEBAR_W,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            width: SIDEBAR_W,
            boxSizing: 'border-box',
            border: 'none',
            borderRight: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark'
                ? 'rgba(15,23,42,0.97)'
                : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
        },
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* SIDEBAR — permanent on desktop */}
            {!isMobile && (
                <Drawer variant="permanent" sx={sidebarSx}>
                    <SidebarContent />
                </Drawer>
            )}

            {/* SIDEBAR — temporary on mobile */}
            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={sidebarSx}
                >
                    <SidebarContent onClose={() => setDrawerOpen(false)} />
                </Drawer>
            )}

            {/* MAIN CONTENT */}
            <Box sx={{
                flexGrow: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                background: theme.palette.background.default,
            }}>
                {/* Mobile top bar */}
                {isMobile ? (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 2, py: 1.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        background: theme.palette.background.paper,
                        position: 'sticky', top: 0, zIndex: 100,
                    }}>
                        <IconButton onClick={() => setDrawerOpen(true)}>
                            <MenuIcon />
                        </IconButton>
                        {appConfig?.logo_app_url ? (
                            <img
                                src={`${BASE_URL}/logos/${appConfig.logo_app_url}`}
                                alt="Logo"
                                style={{ height: 34, objectFit: 'contain' }}
                            />
                        ) : (
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '8px',
                                background: 'linear-gradient(135deg, #4285F4, #1a56db)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ReceiptLongIcon sx={{ color: '#fff', fontSize: 18 }} />
                            </Box>
                        )}
                        <TopBar />
                    </Box>
                ) : (
                    <TopBar />
                )}

                {/* Page content */}
                <Box sx={{ p: { xs: 2, md: 4 }, flex: 1 }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

// ------------------------------------------------
// MAIN APP
// ------------------------------------------------
function App() {
    const { theme } = useAuth();
    const muiTheme = useMemo(
        () => (theme === 'dark' ? darkTheme : lightTheme),
        [theme]
    );

    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/clients"           element={<Clients />} />
                            <Route path="/products"          element={<Products />} />
                            <Route path="/quotations"        element={<Quotations />} />
                            <Route path="/quotations/new"    element={<CreateQuotation />} />
                            <Route path="/quotations/:id/edit" element={<EditQuotation />} />
                            <Route path="/settings"          element={<Settings />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;
