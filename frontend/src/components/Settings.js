import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Users from './Users';
import Accounts from './Accounts';
import './Settings.css';

import BusinessIcon from '@mui/icons-material/Business';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import PeopleIcon from '@mui/icons-material/People';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import WallpaperIcon from '@mui/icons-material/Wallpaper';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';

// ---- Icon helper ----
const icons = {
    empresa: <BusinessIcon sx={{ color: '#4285F4' }} />,
    logo: <ImageIcon sx={{ color: '#4285F4' }} />,
    logoApp: <BrandingWatermarkIcon sx={{ color: '#4285F4' }} />,
    terminos: <DescriptionIcon sx={{ color: '#4285F4' }} />,
    asesores: <PeopleIcon sx={{ color: '#4285F4' }} />,
    cuentas: <VpnKeyIcon sx={{ color: '#4285F4' }} />,
    fondo: <WallpaperIcon sx={{ color: '#4285F4' }} />,
    footer: <ChatBubbleOutlineIcon sx={{ color: '#4285F4' }} />,
};

// ---- Generic Modal Shell ----
function ModalShell({ title, onClose, className = '', children }) {
    const modalContent = (
        <div className="settings-modal-overlay">
            <div className={`settings-modal glass scale-in ${className}`}>
                <div className="settings-modal-header">
                    <h3>{title}</h3>
                    <button className="settings-close-btn" onClick={onClose}>✕</button>
                </div>
                <div className="settings-modal-body">{children}</div>
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
}

// ---- Settings Card ----
function SettingCard({ icon, title, description, onClick, adminOnly = false, isAdmin = false }) {
    if (adminOnly && !isAdmin) return null;
    return (
        <button className="setting-card glass" onClick={onClick}>
            <div className="setting-card-icon-container">
                <div className="setting-card-icon">{icon}</div>
            </div>
            <div className="setting-card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </button>
    );
}

// ====================================================
function Settings() {
    const { account, appConfig, refreshAppConfig } = useAuth();
    const isAdmin = account?.role === 'admin';

    const [activeModal, setActiveModal] = useState(null); // 'empresa' | 'logo' | 'terminos' | 'asesores' | 'cuentas' | 'fondo' | 'footer'
    const [feedback, setFeedback] = useState({ type: '', msg: '' });

    const showFeedback = (type, msg) => {
        setFeedback({ type, msg });
        setTimeout(() => setFeedback({ type: '', msg: '' }), 4000);
    };

    const close = () => setActiveModal(null);

    return (
        <div className="settings-page page-fade-in">
            <div className="settings-header">
                <h1>Configuración</h1>
                <p>Administra los datos de tu empresa y la apariencia del sistema.</p>
            </div>

            {feedback.msg && (
                <div className={`settings-feedback settings-feedback--${feedback.type}`}>
                    {feedback.type === 'success' ? '✅' : '⚠️'} {feedback.msg}
                </div>
            )}

            <div className="settings-cards-grid">
                <SettingCard icon={icons.empresa}  title="Datos de la Empresa"     description="Nombre, dirección, teléfono y sitio web."      onClick={() => setActiveModal('empresa')} />
                <SettingCard icon={icons.logo}     title="Logo de la Empresa"       description="Carga el logo que aparece en las cotizaciones." onClick={() => setActiveModal('logo')} />
                <SettingCard icon={icons.logoApp}  title="Logo de la App"           description="Logotipo del panel principal y pantalla de acceso." onClick={() => setActiveModal('logoApp')} adminOnly={true} isAdmin={isAdmin} />
                <SettingCard icon={icons.terminos} title="Términos y Condiciones"   description="Texto que se imprime al pie de las cotizaciones." onClick={() => setActiveModal('terminos')} />
                <SettingCard icon={icons.footer}   title="Pie de Página del PDF"    description="Mensaje y texto de agradecimiento al pie de cada cotización." onClick={() => setActiveModal('footer')} />
                <SettingCard icon={icons.asesores} title="Asesores de Venta"        description="Gestiona los asesores que elaboran cotizaciones."  onClick={() => setActiveModal('asesores')} />
                <SettingCard icon={icons.fondo}    title="Fondo del Login"          description="Personaliza la imagen de fondo de la pantalla de acceso." onClick={() => setActiveModal('fondo')} adminOnly={true} isAdmin={isAdmin} />
                <SettingCard icon={icons.cuentas}  title="Cuentas (Titulares)"      description="Gestiona las cuentas de titulares del sistema."  onClick={() => setActiveModal('cuentas')} adminOnly={true} isAdmin={isAdmin} />
            </div>

            {/* ---- Modales ---- */}
            {activeModal === 'empresa'  && <EmpresaModal    onClose={close} onSuccess={showFeedback} />}
            {activeModal === 'logo'     && <LogoModal       onClose={close} onSuccess={showFeedback} />}
            {activeModal === 'logoApp'  && <LogoAppModal    onClose={close} onSuccess={showFeedback} appConfig={appConfig} refreshAppConfig={refreshAppConfig} />}
            {activeModal === 'terminos' && <TerminosModal   onClose={close} onSuccess={showFeedback} />}
            {activeModal === 'footer'   && <FooterModal     onClose={close} onSuccess={showFeedback} />}
            {activeModal === 'asesores' && <AsesoresModal   onClose={close} />}
            {activeModal === 'cuentas'  && <CuentasModal    onClose={close} />}
            {activeModal === 'fondo'    && <FondoModal      onClose={close} onSuccess={showFeedback} appConfig={appConfig} refreshAppConfig={refreshAppConfig} />}
        </div>
    );
}

// ====================================================
// MODAL — Empresa
// ====================================================
function EmpresaModal({ onClose, onSuccess }) {
    const [profile, setProfile] = useState({ company_name: '', address: '', phone: '', website: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/company-profile/')
            .then(r => setProfile(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put('/company-profile/', profile);
            onSuccess('success', 'Datos de la empresa guardados correctamente.');
            onClose();
        } catch {
            onSuccess('error', 'Error al guardar los datos de la empresa.');
        }
    };

    return (
        <ModalShell title="Datos de la Empresa" onClose={onClose}>
            {loading ? <p>Cargando...</p> : (
                <form onSubmit={handleSubmit} className="settings-form">
                    {[
                        { label: 'Nombre de la Empresa', key: 'company_name' },
                        { label: 'Dirección',            key: 'address' },
                        { label: 'Teléfono',             key: 'phone' },
                        { label: 'Sitio Web',            key: 'website' },
                    ].map(({ label, key }) => (
                        <div key={key} className="settings-form-group">
                            <label>{label}</label>
                            <input
                                className="settings-input"
                                value={profile[key] || ''}
                                onChange={(e) => setProfile(prev => ({ ...prev, [key]: e.target.value }))}
                            />
                        </div>
                    ))}
                    <div className="settings-modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}

// ====================================================
// MODAL — Logo
// ====================================================
function LogoModal({ onClose, onSuccess }) {
    const fileRef = useRef();
    const [profile, setProfile] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        apiClient.get('/company-profile/').then(r => setProfile(r.data)).catch(() => {});
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await apiClient.post('/company-profile/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setProfile(prev => ({ ...prev, logo_path: `${res.data.logo_path}?t=${Date.now()}` }));
            onSuccess('success', 'Logo actualizado correctamente.');
        } catch {
            onSuccess('error', 'Error al subir el logo.');
        } finally {
            setLoading(false);
        }
    };

    const BASE = 'http://127.0.0.1:8000';
    const logoSrc = profile?.logo_path ? `${BASE}${profile.logo_path}` : null;

    return (
        <ModalShell title="Logo de la Empresa" onClose={onClose}>
            <div className="logo-preview-box">
                {logoSrc
                    ? <img src={logoSrc} alt="Logo" className="logo-preview-img" />
                    : <div className="logo-preview-placeholder">Sin logo</div>
                }
            </div>
            <form onSubmit={handleUpload} className="settings-form" style={{ marginTop: 16 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()} style={{ width: '100%' }}>
                    {file ? `Archivo: ${file.name}` : 'Seleccionar Imagen'}
                </button>
                <div className="settings-modal-footer" style={{ marginTop: 16 }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={!file || loading}>
                        {loading ? 'Subiendo...' : 'Subir Logo'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

// ====================================================
// MODAL — Logo de la App (Global)
// ====================================================
function LogoAppModal({ onClose, onSuccess, appConfig, refreshAppConfig }) {
    const fileRef = useRef();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const BASE = 'http://127.0.0.1:8000';
    const logoSrc = appConfig?.logo_app_url ? `${BASE}/logos/${appConfig.logo_app_url}` : null;

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            await apiClient.post('/app-settings/upload-logo-app', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            refreshAppConfig();
            setFile(null);
            onSuccess('success', 'Logo de la app actualizado correctamente.');
        } catch {
            onSuccess('error', 'Error al subir el logo de la app.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell title="Logo de la App" onClose={onClose}>
            <div className="logo-preview-box">
                {logoSrc
                    ? <img src={logoSrc} alt="Logo App" className="logo-preview-img" />
                    : <div className="logo-preview-placeholder">Sin logo de la app</div>
                }
            </div>
            <form onSubmit={handleUpload} className="settings-form" style={{ marginTop: 16 }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                <button type="button" className="btn-secondary" onClick={() => fileRef.current.click()} style={{ width: '100%' }}>
                    {file ? `Archivo: ${file.name}` : 'Seleccionar Imagen'}
                </button>
                <div className="settings-modal-footer" style={{ marginTop: 16 }}>
                    <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={!file || loading}>
                        {loading ? 'Subiendo...' : 'Subir Logo'}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}

// ====================================================
// MODAL — Términos
// ====================================================
function TerminosModal({ onClose, onSuccess }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/terms-conditions/')
            .then(r => setContent(r.data.content || ''))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put('/terms-conditions/', { content });
            onSuccess('success', 'Términos y condiciones guardados.');
            onClose();
        } catch {
            onSuccess('error', 'Error al guardar los términos.');
        }
    };

    return (
        <ModalShell title="Términos y Condiciones" onClose={onClose}>
            {loading ? <p>Cargando...</p> : (
                <form onSubmit={handleSubmit} className="settings-form">
                    <textarea
                        className="settings-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={10}
                        placeholder="Escribe aquí los términos y condiciones de tus cotizaciones..."
                    />
                    <div className="settings-modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}

// ====================================================
// MODAL — Pie de Página del PDF
// ====================================================
function FooterModal({ onClose, onSuccess }) {
    const [footerText, setFooterText] = useState('');
    const [footerThanks, setFooterThanks] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/company-profile/')
            .then(r => {
                setFooterText(r.data.footer_text || '');
                setFooterThanks(r.data.footer_thanks || '');
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put('/company-profile/', {
                footer_text: footerText,
                footer_thanks: footerThanks,
            });
            onSuccess('success', 'Texto del pie de página guardado correctamente.');
            onClose();
        } catch {
            onSuccess('error', 'Error al guardar el texto del pie de página.');
        }
    };

    return (
        <ModalShell title="Pie de Página del PDF" onClose={onClose}>
            {loading ? <p>Cargando...</p> : (
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="settings-form-group">
                        <label>Mensaje de contacto</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, marginTop: 0 }}>
                            Aparece antes de los datos del asesor. Ej: "Si tiene preguntas, contáctenos."
                        </p>
                        <textarea
                            className="settings-textarea"
                            value={footerText}
                            onChange={(e) => setFooterText(e.target.value)}
                            rows={3}
                            placeholder="Si usted tiene alguna pregunta sobre esta cotización..."
                        />
                    </div>
                    <div className="settings-form-group" style={{ marginTop: 12 }}>
                        <label>Mensaje de agradecimiento</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, marginTop: 0 }}>
                            Aparece resaltado al final del documento.
                        </p>
                        <input
                            className="settings-input"
                            value={footerThanks}
                            onChange={(e) => setFooterThanks(e.target.value)}
                            placeholder="¡Gracias por hacer negocios con nosotros!"
                        />
                    </div>
                    <div className="settings-modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-primary">Guardar</button>
                    </div>
                </form>
            )}
        </ModalShell>
    );
}

// ====================================================
// MODAL — Asesores (embeds <Users /> component)
// ====================================================
function AsesoresModal({ onClose }) {
    return (
        <ModalShell title="Asesores de Venta" onClose={onClose} className="large">
            <Users />
        </ModalShell>
    );
}

// ====================================================
// MODAL — Cuentas (embeds <Accounts /> component)
// ====================================================
function CuentasModal({ onClose }) {
    return (
        <ModalShell title="Gestión de Cuentas (Titulares)" onClose={onClose} className="large">
            <Accounts />
        </ModalShell>
    );
}

// ====================================================
// MODAL — Fondo del Login (con preview)
// ====================================================
function FondoModal({ onClose, onSuccess, appConfig, refreshAppConfig }) {
    const [disponibles, setDisponibles] = useState([]);
    const [selected, setSelected] = useState(appConfig?.fondo_login_url || '');
    const [opacity, setOpacity] = useState(parseFloat(appConfig?.overlay_opacity ?? 0.45));
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();
    const BASE = 'http://127.0.0.1:8000';

    useEffect(() => {
        apiClient.get('/app-settings/fondos/disponibles')
            .then(r => setDisponibles(r.data.fondos || []))
            .catch(() => {});
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await apiClient.post('/app-settings/upload-background', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const newFile = res.data.fondo_login_url;
            setDisponibles(prev => [...prev, newFile]);
            setSelected(newFile);
            setFile(null);
            onSuccess('success', 'Fondo subido y activado correctamente.');
            refreshAppConfig();
        } catch {
            onSuccess('error', 'Error al subir el fondo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            await apiClient.put('/app-settings/', {
                fondo_login_url: selected || null,
                overlay_opacity: String(opacity),
            });
            onSuccess('success', 'Fondo de login guardado correctamente.');
            refreshAppConfig();
            onClose();
        } catch {
            onSuccess('error', 'Error al guardar la configuración del fondo.');
        }
    };

    const previewStyle = selected
        ? { backgroundImage: `url(${BASE}/fondos/${selected})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: '#0f172a' };

    return (
        <ModalShell title="Fondo de la Pantalla de Login" onClose={onClose}>
            <div className="fondo-layout">
                {/* Preview */}
                <div className="fondo-preview" style={previewStyle}>
                    <div className="fondo-overlay-preview" style={{ background: `rgba(10,18,38,${opacity})` }} />
                    <div className="fondo-mock-login glass">
                        <div className="fondo-mock-circle" />
                        <div className="fondo-mock-bar" />
                        <div className="fondo-mock-bar short" />
                    </div>
                </div>

                {/* Controls */}
                <div className="fondo-controls">
                    {/* Lista de disponibles */}
                    <label className="fondo-label">Fondos disponibles</label>
                    {disponibles.length === 0
                        ? <p className="fondo-empty">Ningún fondo subido aún.</p>
                        : (
                            <div className="fondo-list">
                                {disponibles.map(f => (
                                    <button
                                        key={f}
                                        className={`fondo-item${selected === f ? ' active' : ''}`}
                                        onClick={() => setSelected(f)}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )
                    }

                    {/* Quitar fondo */}
                    {selected && (
                        <button className="btn-secondary" style={{ marginTop: 8, width: '100%' }} onClick={() => setSelected('')}>
                            ✕ Sin fondo
                        </button>
                    )}

                    {/* Subir nuevo */}
                    <label className="fondo-label" style={{ marginTop: 16 }}>Subir imagen nueva</label>
                    <input ref={fileRef} type="file" accept="image/*,video/mp4" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files[0])} />
                    <button className="btn-secondary" style={{ width: '100%' }} onClick={() => fileRef.current.click()}>
                        {file ? `📎 ${file.name}` : '📂 Seleccionar archivo'}
                    </button>
                    {file && (
                        <button className="btn-primary" style={{ marginTop: 8, width: '100%' }} onClick={handleUpload} disabled={uploading}>
                            {uploading ? 'Subiendo...' : '⬆️ Subir fondo'}
                        </button>
                    )}

                    {/* Opacidad */}
                    <label className="fondo-label" style={{ marginTop: 16 }}>
                        Oscurecimiento del overlay: <strong>{Math.round(opacity * 100)}%</strong>
                    </label>
                    <input
                        type="range" min="0" max="0.95" step="0.05"
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="fondo-range"
                    />
                </div>
            </div>

            <div className="settings-modal-footer" style={{ marginTop: 20 }}>
                <button className="btn-secondary" onClick={onClose}>Cancelar</button>
                <button className="btn-primary" onClick={handleSave}>Guardar Configuración</button>
            </div>
        </ModalShell>
    );
}

export default Settings;
