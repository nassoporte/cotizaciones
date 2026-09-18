import React, { useState } from 'react';
import apiClient from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Function to fetch products, to be used with useQuery
const fetchProducts = async () => {
    const { data } = await apiClient.get('/products/');
    return data;
};

function Products() {
    const queryClient = useQueryClient();

    // State for dialogs and forms
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const initialFormState = { id: null, name: '', description: '', price: '' };
    const [formState, setFormState] = useState(initialFormState);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // useQuery for fetching products
    const { data: products = [], isLoading, isError } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

    // Mutations for create, update, delete
    const createProductMutation = useMutation({
        mutationFn: (newProduct) => apiClient.post('/products/', newProduct),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setFeedback({ type: 'success', message: 'Producto creado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo crear el producto.' }); },
    });

    const updateProductMutation = useMutation({
        mutationFn: (updatedProduct) => apiClient.put(`/products/${updatedProduct.id}`, updatedProduct),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setFeedback({ type: 'success', message: 'Producto actualizado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo actualizar el producto.' }); },
    });

    const deleteProductMutation = useMutation({
        mutationFn: (productId) => apiClient.delete(`/products/${productId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setFeedback({ type: 'success', message: 'Producto eliminado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo eliminar el producto.' }); },
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.name.trim() || !formState.price) {
            setFeedback({ type: 'error', message: 'El nombre y el precio son obligatorios.' });
            return;
        }

        const productData = { 
            id: formState.id,
            name: formState.name, 
            description: formState.description, 
            price: parseFloat(formState.price) 
        };

        if (isEdit) {
            updateProductMutation.mutate(productData);
        } else {
            createProductMutation.mutate(productData);
        }
    };

    const handleDelete = () => {
        if (selectedProductId) {
            deleteProductMutation.mutate(selectedProductId);
        }
    };

    return (
        <div className="page-fade-in">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: 4 }}>
                <Typography variant="h4" component="h1">Gestión de Productos</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Producto
                </Button>
            </Box>

            <Snackbar open={!!feedback.message} autoHideDuration={5000} onClose={() => setFeedback({ type: '', message: '' })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setFeedback({ type: '', message: '' })} severity={feedback.type || 'info'} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
            ) : isError ? (
                <Alert severity="error">No se pudieron cargar los productos.</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Descripción</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map(product => (
                                <TableRow key={product.id} hover>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{product.description || 'N/A'}</TableCell>
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
                        <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>Crear</Button>
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
                    <Button onClick={handleDelete} color="error" disabled={deleteProductMutation.isPending}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Products;