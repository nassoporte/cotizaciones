import React, { useState } from 'react';
import apiClient from '../api/axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Alert, CircularProgress, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Modal para crear un cliente rápidamente desde la pantalla de cotización.
 * Props:
 *   open        {boolean}  — controla visibilidad
 *   onClose     {fn}       — cierra sin seleccionar
 *   initialName {string}   — nombre prelllenado desde el Autocomplete
 *   onCreated   {fn(client)} — callback con el cliente recién creado
 */
function QuickAddClientModal({ open, onClose, initialName = '', onCreated }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: initialName,
        contact_person: '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Sincronizar initialName cuando cambia (el usuario escribe diferente)
    React.useEffect(() => {
        setForm(prev => ({ ...prev, name: initialName }));
    }, [initialName]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('El nombre del cliente es obligatorio.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await apiClient.post('/clients/', {
                name: form.name.trim(),
                contact_person: form.contact_person,
                email: form.email,
                phone: form.phone,
            });
            // Invalidar caché para que el módulo de Clientes también se actualice
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            onCreated(res.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al crear el cliente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ name: '', contact_person: '', email: '', phone: '' });
        setError('');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <PersonAddIcon color="primary" />
                Nuevo Cliente
                <IconButton onClick={handleClose} sx={{ ml: 'auto' }} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <Box component="form" onSubmit={handleSubmit}>
                <DialogContent sx={{ pt: 1 }}>
                    {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                    <TextField
                        autoFocus
                        fullWidth margin="dense" size="small"
                        label="Nombre del Cliente *"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        fullWidth margin="dense" size="small"
                        label="Persona de contacto"
                        name="contact_person"
                        value={form.contact_person}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth margin="dense" size="small"
                        label="Email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth margin="dense" size="small"
                        label="Teléfono"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                    <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ borderRadius: 50 }}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
                        sx={{ borderRadius: 50 }}
                    >
                        {loading ? 'Creando...' : 'Crear Cliente'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

export default QuickAddClientModal;
