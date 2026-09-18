import React, { useState } from 'react';
import apiClient from '../api/axios';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Alert, CircularProgress,
    IconButton, InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Modal para crear un producto rápidamente desde la pantalla de cotización.
 * Props:
 *   open        {boolean}
 *   onClose     {fn}
 *   initialName {string}   — nombre prellenado desde el Autocomplete
 *   onCreated   {fn(product)} — callback con el producto recién creado
 */
function QuickAddProductModal({ open, onClose, initialName = '', onCreated }) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: initialName,
        description: '',
        price: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        setForm(prev => ({ ...prev, name: initialName }));
    }, [initialName]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) {
            setError('El nombre y el precio son obligatorios.');
            return;
        }
        const price = parseFloat(form.price);
        if (isNaN(price) || price < 0) {
            setError('El precio debe ser un número válido.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await apiClient.post('/products/', {
                name: form.name.trim(),
                description: form.description,
                price,
            });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            onCreated(res.data);
            handleClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al crear el producto.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({ name: '', description: '', price: '' });
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
                <AddBoxIcon color="primary" />
                Nuevo Producto / Servicio
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
                        label="Nombre del Producto / Servicio *"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <TextField
                        fullWidth margin="dense" size="small"
                        label="Descripción (opcional)"
                        name="description"
                        multiline
                        rows={2}
                        value={form.description}
                        onChange={handleChange}
                    />
                    <TextField
                        fullWidth margin="dense" size="small"
                        label="Precio Unitario *"
                        name="price"
                        type="number"
                        value={form.price}
                        onChange={handleChange}
                        required
                        InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        inputProps={{ min: 0, step: '0.01' }}
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
                        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddBoxIcon />}
                        sx={{ borderRadius: 50 }}
                    >
                        {loading ? 'Creando...' : 'Crear Producto'}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
}

export default QuickAddProductModal;
