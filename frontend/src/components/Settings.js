import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Accounts from './Accounts';
import Users from './Users';
import {
    Container,
    Typography,
    Button,
    Box,
    Paper,
    TextField,
    CircularProgress,
    Alert,
    Snackbar,
    Grid,
    Card,
    CardMedia
} from '@mui/material';

function Settings() {
    const { account } = useAuth();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        company_name: '',
        address: '',
        phone: '',
        website: '',
        logo_path: ''
    });
    const [terms, setTerms] = useState({ content: '' });
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProfileAndTerms = useCallback(async () => {
        try {
            setLoading(true);
            const profileResponse = await apiClient.get('/company-profile/');
            setProfile(profileResponse.data);

            const termsResponse = await apiClient.get('/terms-conditions/');
            setTerms(termsResponse.data);

        } catch (err) {
            setError('No se pudo cargar la configuración inicial.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfileAndTerms();
    }, [fetchProfileAndTerms]);

    const handleFeedback = (setter, message) => {
        setter(message);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleTermsChange = (e) => {
        const { value } = e.target;
        setTerms(prev => ({ ...prev, content: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleSelectFileClick = () => {
        fileInputRef.current.click();
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put('/company-profile/', profile);
            handleFeedback(setSuccess, 'Información de la empresa guardada con éxito.');
        } catch (err) {
            handleFeedback(setError, 'Error al guardar la información de la empresa.');
        }
    };

    const handleLogoSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            handleFeedback(setError, 'Por favor, selecciona un archivo de logo.');
            return;
        }
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await apiClient.post('/company-profile/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newLogoPath = `${response.data.logo_path}?t=${new Date().getTime()}`;
            setProfile(prev => ({ ...prev, logo_path: newLogoPath }));
            setSelectedFile(null);
            handleFeedback(setSuccess, 'Logo subido con éxito.');
        } catch (err) {
            handleFeedback(setError, 'Error al subir el logo.');
        }
    };

    const handleTermsSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiClient.put('/terms-conditions/', terms);
            handleFeedback(setSuccess, 'Términos y condiciones guardados con éxito.');
        } catch (err) {
            handleFeedback(setError, 'Error al guardar los términos y condiciones.');
        }
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" sx={{ mb: 4 }}>Configuración</Typography>

            <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
            </Snackbar>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
            ) : (
                <Grid container spacing={4}>
                    {/* Company Info Section */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Información de la Empresa</Typography>
                            <Box component="form" onSubmit={handleInfoSubmit} noValidate>
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Nombre de la Empresa"
                                    name="company_name"
                                    value={profile.company_name}
                                    onChange={handleInputChange}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Dirección"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleInputChange}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Teléfono"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleInputChange}
                                />
                                <TextField
                                    fullWidth
                                    margin="normal"
                                    label="Sitio Web"
                                    name="website"
                                    value={profile.website}
                                    onChange={handleInputChange}
                                />
                                <Button type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
                                    Guardar Información
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Company Logo Section */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Logo de la Empresa</Typography>
                            <Card sx={{ maxWidth: 345, mb: 2, mx: 'auto' }}>
                                <CardMedia
                                    component="img"
                                    height="140"
                                    image={profile.logo_path ? `http://127.0.0.1:8000${profile.logo_path}` : 'https://via.placeholder.com/345x140?text=No+Logo'}
                                    alt="Logo de la empresa"
                                    sx={{ objectFit: 'contain' }}
                                />
                            </Card>
                            <Box component="form" onSubmit={handleLogoSubmit} noValidate>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                                <Button variant="outlined" onClick={handleSelectFileClick} fullWidth>
                                    Seleccionar Archivo
                                </Button>
                                {selectedFile && (
                                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                                        Archivo seleccionado: {selectedFile.name}
                                    </Typography>
                                )}
                                <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={!selectedFile} fullWidth>
                                    Subir Nuevo Logo
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Terms and Conditions Section */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                            <Typography variant="h6" gutterBottom>Términos y Condiciones de la Cotización</Typography>
                            <Box component="form" onSubmit={handleTermsSubmit} noValidate>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    margin="normal"
                                    label="Términos y Condiciones"
                                    name="terms_conditions"
                                    value={terms.content}
                                    onChange={handleTermsChange}
                                />
                                <Button type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
                                    Guardar Términos y Condiciones
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Users (Asesores) Management Section */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                            <Users />
                        </Paper>
                    </Grid>

                    {/* Accounts Management Section (Admin Only) */}
                    {account && account.role === 'admin' && (
                        <Grid item xs={12}>
                            <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                                <Typography variant="h6" gutterBottom>Gestión de Cuentas (Titulares)</Typography>
                                <Accounts />
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}
        </Container>
    );
}

export default Settings;
