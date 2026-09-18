import React, { useState } from 'react';
import { FaUser, FaLock, FaMoon, FaSun } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import apiClient from '../api/axios';
import './Login.css';

function Login() {
    const { isAuthenticated, login, appConfig, theme, toggleTheme } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // Si ya está autenticado, redirigir automáticamente
    if (isAuthenticated) {
        return <Navigate to="/quotations" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);
        const success = await login(username, password);
        if (success) {
            navigate('/quotations');
        } else {
            setErrorMsg('Usuario o contraseña incorrectos.');
        }
        setLoading(false);
    };

    const BASE_URL = apiClient.defaults.baseURL || 'http://127.0.0.1:8000';

    const bgStyle = appConfig?.fondo_login_url
        ? { backgroundImage: `url(${BASE_URL}/fondos/${appConfig.fondo_login_url})` }
        : {};
    const overlayOpacity = parseFloat(appConfig?.overlay_opacity ?? 0.45);

    return (
        <div className="login-page" style={bgStyle}>
            {/* Overlay oscuro */}
            <div
                className="login-bg-overlay"
                style={{ background: `rgba(10, 18, 38, ${overlayOpacity})` }}
            />

            {/* Toggle de tema */}
            <button className="login-theme-toggle" onClick={toggleTheme} title="Cambiar tema">
                {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>

            {/* Caja principal */}
            <div className="login-card glass page-fade-in">
                {/* Header */}
                <div className="login-card-header">
                    {appConfig?.logo_app_url && (
                        <img
                            src={`${BASE_URL}/logos/${appConfig.logo_app_url}`}
                            alt="Logo"
                            style={{ maxHeight: 90, objectFit: 'contain', margin: '0 auto 14px', display: 'block' }}
                        />
                    )}
                    <h1 className="login-title">Cotizador</h1>
                    <p className="login-subtitle">Inicia sesión para continuar</p>
                </div>

                {/* Error */}
                {errorMsg && (
                    <div className="login-error-banner">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="login-form">
                    <div className="login-input-group">
                        <FaUser className="login-input-icon" />
                        <input
                            className="login-input"
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="login-input-group">
                        <FaLock className="login-input-icon" />
                        <input
                            className="login-input"
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="login-submit-btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Iniciando sesión...' : 'Entrar'}
                    </button>
                </form>

                <div className="login-footer">
                    Sistema de Cotizaciones
                </div>
            </div>
        </div>
    );
}

export default Login;