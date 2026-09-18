import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/axios';
import {
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
    Snackbar,
    Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const fetchUsers = async () => {
    const { data } = await apiClient.get('/users/');
    return data;
};

function Users() {
    const queryClient = useQueryClient();
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const initialFormState = { id: null, full_name: '', email: '', phone: '' };
    const [formState, setFormState] = useState(initialFormState);

    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const { data: users = [], isLoading, isError } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

    const createUserMutation = useMutation({
        mutationFn: (newUser) => apiClient.post('/users/', newUser),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setFeedback({ type: 'success', message: 'Asesor creado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo crear el asesor.' }); },
    });

    const updateUserMutation = useMutation({
        mutationFn: (updatedUser) => apiClient.put(`/users/${updatedUser.id}`, updatedUser),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setFeedback({ type: 'success', message: 'Asesor actualizado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo actualizar el asesor.' }); },
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId) => apiClient.delete(`/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setFeedback({ type: 'success', message: 'Asesor eliminado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => { setFeedback({ type: 'error', message: 'No se pudo eliminar el asesor.' }); },
    });

    const handleOpenCreate = () => {
        setIsEdit(false);
        setFormState(initialFormState);
        setOpenFormDialog(true);
    };

    const handleOpenEdit = (user) => {
        setIsEdit(true);
        setSelectedUser(user);
        setFormState({ id: user.id, full_name: user.full_name, email: user.email, phone: user.phone || '' });
        setOpenFormDialog(true);
    };

    const handleOpenDeleteDialog = (user) => {
        setSelectedUser(user);
        setOpenDeleteDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenFormDialog(false);
        setOpenDeleteDialog(false);
        setSelectedUser(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.full_name || !formState.email) {
            setFeedback({ type: 'error', message: 'Nombre y email son obligatorios.' });
            return;
        }

        const userData = { full_name: formState.full_name, email: formState.email, phone: formState.phone };

        if (isEdit) {
            updateUserMutation.mutate({ ...userData, id: selectedUser.id });
        } else {
            createUserMutation.mutate(userData);
        }
    };

    const handleDelete = () => {
        if (selectedUser) {
            deleteUserMutation.mutate(selectedUser.id);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                    Gestión de Asesores
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Asesor
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
                <Alert severity="error">No se pudieron cargar los asesores.</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre Completo</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Teléfono</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.phone || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Chip label={user.is_active ? 'Activo' : 'Inactivo'} color={user.is_active ? 'success' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenEdit(user)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(user)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Form Dialog for Create/Edit */}
            <Dialog open={openFormDialog} onClose={handleCloseDialogs}>
                <DialogTitle>{isEdit ? 'Editar Asesor' : 'Crear Nuevo Asesor'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField autoFocus margin="dense" name="full_name" label="Nombre Completo" type="text" fullWidth variant="outlined" value={formState.full_name} onChange={handleFormChange} required />
                        <TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="outlined" value={formState.email} onChange={handleFormChange} required />
                        <TextField margin="dense" name="phone" label="Teléfono (Opcional)" type="text" fullWidth variant="outlined" value={formState.phone} onChange={handleFormChange} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialogs}>Cancelar</Button>
                        <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
                            {isEdit ? 'Guardar Cambios' : 'Crear'}
                        </Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDialogs}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de que desea eliminar a este asesor? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialogs}>Cancelar</Button>
                    <Button onClick={handleDelete} color="error" disabled={deleteUserMutation.isPending}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Users;
