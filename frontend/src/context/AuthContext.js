import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [appConfig, setAppConfig] = useState({
        fondo_login_url: null,
        overlay_opacity: '0.4',
        logo_app_url: null,
    });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // Apply theme to <html> element
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        localStorage.setItem('theme', next);
    };

    // Load public app config (login background) — no auth needed
    const fetchAppConfig = async () => {
        try {
            const res = await apiClient.get('/app-settings/');
            setAppConfig(res.data);
        } catch {
            // Use defaults silently
        }
    };

    useEffect(() => {
        fetchAppConfig();

        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await apiClient.get('/accounts/me');
                    setAccount(response.data);
                } catch (error) {
                    console.error('Invalid token, logging out', error);
                    localStorage.removeItem('token');
                    setAccount(null);
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            const response = await apiClient.post('/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            const accountResponse = await apiClient.get('/accounts/me');
            setAccount(accountResponse.data);
            setLoading(false);
            return true;
        } catch (error) {
            console.error('Login failed', error);
            localStorage.removeItem('token');
            setAccount(null);
            setLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAccount(null);
    };

    const refreshAppConfig = () => fetchAppConfig();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg)',
                fontFamily: "'Outfit', sans-serif",
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                gap: '12px',
            }}>
                <span style={{
                    width: 24, height: 24,
                    border: '3px solid var(--primary-light)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                }} />
                Cargando...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            isAuthenticated: !!account,
            account,
            loading,
            login,
            logout,
            appConfig,
            refreshAppConfig,
            theme,
            toggleTheme,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
