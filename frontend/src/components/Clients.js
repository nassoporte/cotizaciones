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

// Function to fetch clients
const fetchClients = async () => {
    const { data } = await apiClient.get('/clients/');
    return data;
};

function Clients() {
    const queryClient = useQueryClient();

    // Dialog and form state
    const [openFormDialog, setOpenFormDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const initialFormState = { id: null, name: '', contact_person: '', email: '', phone: '' };
    const [formState, setFormState] = useState(initialFormState);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Fetching data with useQuery
    const { data: clients = [], isLoading, isError } = useQuery({ queryKey: ['clients'], queryFn: fetchClients });

    // Mutations
    const createClientMutation = useMutation({
        mutationFn: (newClient) => apiClient.post('/clients/', newClient),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setFeedback({ type: 'success', message: 'Cliente creado con éxito.' });
            handleCloseDialogs();
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || 'No se pudo crear el cliente.';
            setFeedback({ type: 'error', message: errorMsg });
        },
    });

    const updateClientMutation = useMutation({
        mutationFn: (updatedClient) => apiClient.put(`/clients/${updatedClient.id}`, updatedClient),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setFeedback({ type: 'success', message: 'Cliente actualizado con éxito.' });
            handleCloseDialogs();
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.detail || 'No se pudo actualizar el cliente.';
            setFeedback({ type: 'error', message: errorMsg });
        },
    });

    const deleteClientMutation = useMutation({
        mutationFn: (clientId) => apiClient.delete(`/clients/${clientId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setFeedback({ type: 'success', message: 'Cliente eliminado con éxito.' });
            handleCloseDialogs();
        },
        onError: () => {
            setFeedback({ type: 'error', message: 'No se pudo eliminar el cliente.' });
        },
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

    const handleOpenEdit = (client) => {
        setIsEdit(true);
        setFormState({ 
            id: client.id, 
            name: client.name, 
            contact_person: client.contact_person || '',
            email: client.email || '',
            phone: client.phone || ''
        });
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formState.name.trim()) {
            setFeedback({ type: 'error', message: 'El nombre del cliente es obligatorio.' });
            return;
        }

        const clientData = { 
            id: formState.id,
            name: formState.name, 
            contact_person: formState.contact_person,
            email: formState.email,
            phone: formState.phone
        };

        if (isEdit) {
            updateClientMutation.mutate(clientData);
        } else {
            createClientMutation.mutate(clientData);
        }
    };

    const handleDelete = () => {
        if (selectedClientId) {
            deleteClientMutation.mutate(selectedClientId);
        }
    };

    return (
        <div className="page-fade-in">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: 4 }}>
                <Typography variant="h4" component="h1">Gestión de Clientes</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Crear Nuevo Cliente
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
                <Alert severity="error">No se pudieron cargar los clientes.</Alert>
            ) : (
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>ID Cliente</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Teléfono</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clients.map(client => (
                                <TableRow key={client.id} hover>
                                    <TableCell>{client.name}</TableCell>
                                    <TableCell>{client.client_id_number || 'N/A'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{client.email || 'N/A'}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{client.phone || 'N/A'}</TableCell>
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
                        <TextField autoFocus margin="dense" name="name" label="Nombre del Cliente" type="text" fullWidth variant="outlined" value={formState.name} onChange={handleFormChange} required />
                        <TextField margin="dense" name="contact_person" label="Persona de Contacto" type="text" fullWidth variant="outlined" value={formState.contact_person} onChange={handleFormChange} />
                        <TextField margin="dense" name="email" label="Email" type="email" fullWidth variant="outlined" value={formState.email} onChange={handleFormChange} />
                        <TextField margin="dense" name="phone" label="Teléfono" type="text" fullWidth variant="outlined" value={formState.phone} onChange={handleFormChange} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialogs}>Cancelar</Button>
                        <Button type="submit" disabled={createClientMutation.isPending || updateClientMutation.isPending}>{isEdit ? 'Guardar Cambios' : 'Crear'}</Button>
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
                    <Button onClick={handleDelete} color="error" disabled={deleteClientMutation.isPending}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Clients;