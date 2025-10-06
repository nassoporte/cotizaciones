import React, { useState, useEffect, useCallback } from 'react';
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

function Users() {
    const [users, setUsers] = useState([]);
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const initialFormState = { id: null, full_name: '', email: '', phone: '' };
    const [formState, setFormState] = useState(initialFormState);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/users/');
            setUsers(response.data);
        } catch (err) {
            setError('No se pudieron cargar los asesores.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.full_name || !formState.email) {
            handleFeedback(setError, 'Nombre y email son obligatorios.');
            return;
        }

        const userData = { full_name: formState.full_name, email: formState.email, phone: formState.phone };

        const url = isEdit ? `/users/${selectedUser.id}` : '/users/';
        const method = isEdit ? 'put' : 'post';

        try {
            const response = await apiClient[method](url, userData);
            if (isEdit) {
                setUsers(users.map(u => (u.id === selectedUser.id ? response.data : u)));
                handleFeedback(setSuccess, 'Asesor actualizado con éxito.');
            } else {
                setUsers([...users, response.data]);
                handleFeedback(setSuccess, 'Asesor creado con éxito.');
            }
            handleCloseDialogs();
        } catch (err) {
            handleFeedback(setError, `No se pudo ${isEdit ? 'actualizar' : 'crear'} el asesor.`);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await apiClient.delete(`/users/${selectedUser.id}`);
            setUsers(users.filter(u => u.id !== selectedUser.id));
            handleFeedback(setSuccess, 'Asesor eliminado con éxito.');
        } catch (err) {
            handleFeedback(setError, 'No se pudo eliminar el asesor.');
        }
        handleCloseDialogs();
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">Gestión de Asesores</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Asesor
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
                        <Button type="submit">{isEdit ? 'Guardar Cambios' : 'Crear'}</Button>
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
                    <Button onClick={handleDelete} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Users;
