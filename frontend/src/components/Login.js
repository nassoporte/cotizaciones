import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Grid,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    Link,
    CircularProgress
} from '@mui/material';
import Fondo from '../Fondo.jpg'; // Import the background image

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const success = await login(username, password);
        setLoading(false);

        if (success) {
            navigate('/clients'); // Redirect to a default page after login
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <Grid 
            container 
            component="main" 
            sx={{
                minHeight: '100vh',
                backgroundImage: `url(${Fondo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Grid item xs={11} sm={8} md={4} component={Paper} elevation={6} 
                sx={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 4,
                    maxWidth: 400, // Set a max-width for the form
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(4px)',
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 2, color: '#212121' }}>
                    Iniciar Sesión
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Usuario"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        sx={{ '& .MuiInputBase-input': { color: '#212121' } }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Contraseña"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        variant="outlined"
                        sx={{ '& .MuiInputBase-input': { color: '#212121' } }}
                    />
                    {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2, py: 1.5 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                    <Box textAlign="center">
                        <Link component={RouterLink} to="/register" variant="body2">
                            ¿No tienes una cuenta? Regístrate
                        </Link>
                    </Box>
                </Box>
            </Grid>
        </Grid>
    );
}

export default Login;