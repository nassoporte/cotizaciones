import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import apiClient from '../api/axios';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Link,
    Snackbar
} from '@mui/material';

function Register() {
    const [formState, setFormState] = useState({ fullName: '', username: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.fullName || !formState.username || !formState.password) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await apiClient.post('/accounts/', {
                full_name: formState.fullName,
                username: formState.username,
                password: formState.password
            });
            setSuccess('¡Registro exitoso! Redirigiendo al login...');
            setTimeout(() => {
                navigate('/'); // Corrected route
            }, 2000);
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.detail || 'Error en el registro.');
            } else {
                setError('No se pudo conectar al servidor. Inténtalo de nuevo más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper
                elevation={3}
                sx={{
                    marginTop: 8,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    borderRadius: 4 // Consistent with theme.js shape.borderRadius
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Crear Cuenta
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="fullName"
                        label="Nombre Completo"
                        name="fullName"
                        autoComplete="name"
                        autoFocus
                        value={formState.fullName}
                        onChange={handleFormChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Nombre de Usuario"
                        name="username"
                        autoComplete="username"
                        value={formState.username}
                        onChange={handleFormChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Contraseña"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={formState.password}
                        onChange={handleFormChange}
                        disabled={loading}
                    />
                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    {success && <Snackbar
                        open={!!success}
                        autoHideDuration={2000}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        onClose={() => setSuccess('')}>
                        <Alert severity="success" sx={{ width: '100%' }}>{success}</Alert>
                    </Snackbar>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading || !!success}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
                    </Button>
                    <Box textAlign="center">
                        <Link component={RouterLink} to="/" variant="body2"> {/* Corrected route */}
                            ¿Ya tienes una cuenta? Inicia Sesión
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default Register;