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

function Clients() {
    const [clients, setClients] = useState([]);
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);

    const initialFormState = { id: null, name: '', client_id_number: '' };
    const [formState, setFormState] = useState(initialFormState);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/clients/');
            setClients(response.data);
        } catch (err) {
            setError('No se pudieron cargar los clientes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const handleFeedback = (setter, message) => {
        setter(message);
        setTimeout(() => setter(''), 5000);
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

    const handleOpenEdit = (client) => {
        setIsEdit(true);
        setFormState({ id: client.id, name: client.name, client_id_number: client.client_id_number || '' });
        setOpenFormDialog(true);
    };

    const handleOpenDeleteDialog = (id) => {
        setSelectedClientId(id);
        setOpenDeleteDialog(true);
    };

    const handleCloseDialogs = () => {
        setOpenFormDialog(false);
        setOpenDeleteDialog(false);
        setSelectedClientId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.name.trim()) {
            handleFeedback(setError, 'El nombre del cliente es obligatorio.');
            return;
        }

        const clientData = { name: formState.name, client_id_number: formState.client_id_number };
        const url = isEdit ? `/clients/${formState.id}` : '/clients/';
        const method = isEdit ? 'put' : 'post';

        try {
            const response = await apiClient[method](url, clientData);
            if (isEdit) {
                setClients(clients.map(c => (c.id === formState.id ? response.data : c)));
                handleFeedback(setSuccess, 'Cliente actualizado con éxito.');
            } else {
                setClients([...clients, response.data]);
                handleFeedback(setSuccess, 'Cliente creado con éxito.');
            }
            handleCloseDialogs();
        } catch (err) {
            handleFeedback(setError, `No se pudo ${isEdit ? 'actualizar' : 'crear'} el cliente.`);
        }
    };

    const handleDelete = async () => {
        if (!selectedClientId) return;
        try {
            await apiClient.delete(`/clients/${selectedClientId}`);
            setClients(clients.filter(c => c.id !== selectedClientId));
            handleFeedback(setSuccess, 'Cliente eliminado con éxito.');
        } catch (err) {
            handleFeedback(setError, 'No se pudo eliminar el cliente.');
        }
        handleCloseDialogs();
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">Gestión de Clientes</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Cliente
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
                                <TableCell>ID Cliente</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clients.map(client => (
                                <TableRow key={client.id} hover>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.client_id_number || 'N/A'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenEdit(client)}><EditIcon /></IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(client.id)} color="error"><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Form Dialog for Create/Edit */}
            <Dialog open={openFormDialog} onClose={handleCloseDialogs}>
                <DialogTitle>{isEdit ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</DialogTitle>
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            name="name"
                            label="Nombre del Cliente"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={formState.name}
                            onChange={handleFormChange}
                            required
                        />
                        <TextField
                            margin="dense"
                            name="client_id_number"
                            label="ID de Cliente (Opcional)"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={formState.client_id_number}
                            onChange={handleFormChange}
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
                        ¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.
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

export default Clients;