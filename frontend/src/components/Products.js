import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import {
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function Products() {
    const [products, setProducts] = useState([]);
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);

    const initialFormState = { id: null, name: '', description: '', price: '' };
    const [formState, setFormState] = useState(initialFormState);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/products/');
            setProducts(response.data);
        } catch (err) {
            setError('No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFeedback = (setter, message) => {
        setter(message);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleOpenCreate = () => {
        setIsEdit(false);
        setFormState(initialFormState);
        setOpenFormDialog(true);
    };

    const handleOpenEdit = (product) => {
        setIsEdit(true);
        setFormState({ id: product.id, name: product.name, description: product.description || '', price: product.price });
        setOpenFormDialog(true);
    };

    const handleOpenDeleteDialog = (id) => {
        setSelectedProductId(id);
        setOpenDeleteDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenFormDialog(false);
        setOpenDeleteDialog(false);
        setSelectedProductId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.name.trim() || !formState.price) {
            handleFeedback(setError, 'El nombre y el precio son obligatorios.');
            return;
        }

        const productData = { 
            name: formState.name, 
            description: formState.description, 
            price: parseFloat(formState.price) 
        };

        const url = isEdit ? `/products/${formState.id}` : '/products/';
        const method = isEdit ? 'put' : 'post';

        try {
            const response = await apiClient[method](url, productData);
            if (isEdit) {
                setProducts(products.map(p => (p.id === formState.id ? response.data : p)));
                handleFeedback(setSuccess, 'Producto actualizado con éxito.');
            } else {
                setProducts([...products, response.data]);
                handleFeedback(setSuccess, 'Producto creado con éxito.');
            }
            handleCloseDialogs();
        } catch (err) {
            handleFeedback(setError, `No se pudo ${isEdit ? 'actualizar' : 'crear'} el producto.`);
        }
    };

    const handleDelete = async () => {
        if (!selectedProductId) return;
        try {
            await apiClient.delete(`/products/${selectedProductId}`);
            setProducts(products.filter(p => p.id !== selectedProductId));
            handleFeedback(setSuccess, 'Producto eliminado con éxito.');
        } catch (err) {
            handleFeedback(setError, 'No se pudo eliminar el producto.');
        }
        handleCloseDialogs();
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">Gestión de Productos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Producto
                </Button>
            </Box>

            <Snackbar open={!!success} autoHideDuration={5000} onClose={() => setSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>{success}</Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>{error}</Alert>
            </Snackbar>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id} hover>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.description || 'N/A'}</TableCell>
                                    <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenEdit(product)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(product.id)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Form Dialog for Create/Edit */}
            <Dialog open={openFormDialog} onClose={handleCloseDialogs}>
                <DialogTitle>{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="name"
                            label="Nombre del Producto"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={formState.name}
                            onChange={handleFormChange}
                            required
                        />
                        <TextField
                            margin="dense"
                            name="description"
                            label="Descripción (Opcional)"
                            type="text"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            value={formState.description}
                            onChange={handleFormChange}
                        />
                        <TextField
                            margin="dense"
                            name="price"
                            label="Precio Unitario"
                            type="number"
                            fullWidth
                            variant="outlined"
                            value={formState.price}
                            onChange={handleFormChange}
                            required
                            InputProps={{ startAdornment: <Typography>$</Typography> }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialogs}>Cancelar</Button>
                        <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Crear'}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancelar</Button>
                    <Button onClick={handleDelete} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Products;