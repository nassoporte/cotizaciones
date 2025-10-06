import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Button,
    TextField,
    Grid,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function Accounts() {
    const [accounts, setAccounts] = useState([]);
    const [createFormState, setCreateFormState] = useState({
        full_name: '',
        username: '',
        password: '',
        role: 'user'
    });
    const [editFormState, setEditFormState] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteDialogError, setDeleteDialogError] = useState(''); // New state for dialog-specific error
    const [openEditDialog, setOpenEditDialog] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/accounts/');
            setAccounts(response.data);
            setError('');
        } catch (error) {
            console.error("Error fetching accounts:", error);
            setError(error.response?.data?.detail || 'No tiene permisos para ver las cuentas.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFormChange = (e) => {
        setCreateFormState({ ...createFormState, [e.target.name]: e.target.value });
    };

    const handleEditFormChange = (e) => {
        setEditFormState({ ...editFormState, [e.target.name]: e.target.value });
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!createFormState.username.trim() || !createFormState.password.trim() || !createFormState.full_name.trim()) {
            setError('Nombre, usuario y contraseña son requeridos.');
            return;
        }
        try {
            await apiClient.post('/accounts/', createFormState);
            fetchAccounts(); // Refresh list
            setCreateFormState({
                full_name: '',
                username: '',
                password: '',
                role: 'user'
            });
            setSuccess('Cuenta de titular creada con éxito.');
        } catch (error) {
            console.error("Error creating account:", error);
            setError(error.response?.data?.detail || 'Error al crear la cuenta.');
        }
    };

    const handleOpenDeleteDialog = (id) => {
        setAccountToDelete(id);
        setDeletePassword('');
        setDeleteDialogError(''); // Reset dialog error on open
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setAccountToDelete(null);
        setDeletePassword('');
        setDeleteDialogError(''); // Reset dialog error on close
    };

    const handleDeleteAccount = async () => {
        if (!accountToDelete || !deletePassword) {
            setDeleteDialogError('Por favor, ingrese su contraseña para confirmar.');
            return;
        }
        setDeleteDialogError(''); // Clear previous dialog errors
        setError('');
        setSuccess('');
        try {
            await apiClient.post(`/accounts/${accountToDelete}/delete`, { password: deletePassword });
            fetchAccounts(); // Refresh list
            setSuccess('Cuenta eliminada con éxito.');
            handleCloseDeleteDialog();
        } catch (error) {
            console.error("Error deleting account:", error);
            // Set the dialog-specific error message
            setDeleteDialogError(error.response?.data?.detail || 'Error al eliminar la cuenta. Verifique su contraseña.');
        }
    };

    const handleOpenEditDialog = (account) => {
        setEditFormState(account);
        setOpenEditDialog(true);
    };

    const handleCloseEditDialog = () => {
        setOpenEditDialog(false);
        setEditFormState(null);
    };

    const handleUpdateAccount = async (e) => {
        e.preventDefault();
        if (!editFormState || !editFormState.full_name.trim() || !editFormState.username.trim()) {
            setError('Nombre completo y usuario son requeridos.');
            return;
        }
        try {
            const { id, ...updateData } = editFormState;
            await apiClient.put(`/accounts/${id}`, updateData);
            fetchAccounts(); // Refresh list
            setSuccess('Cuenta actualizada con éxito.');
            handleCloseEditDialog();
        } catch (error) {
            console.error("Error updating account:", error);
            setError(error.response?.data?.detail || 'Error al actualizar la cuenta.');
        }
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Gestión de Titulares (Cuentas)
            </Typography>

            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

            <Accordion sx={{ mb: 4 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Crear Nuevo Titular</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box component="form" onSubmit={handleCreateAccount} sx={{ mt: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField label="Nombre Completo" name="full_name" value={createFormState.full_name} onChange={handleCreateFormChange} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField label="Username (para login)" name="username" value={createFormState.username} onChange={handleCreateFormChange} fullWidth required />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <TextField type="password" label="Contraseña" name="password" value={createFormState.password} onChange={handleCreateFormChange} fullWidth required autoComplete="new-password" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <TextField select label="Rol" name="role" value={createFormState.role} onChange={handleCreateFormChange} fullWidth>
                                    <MenuItem value="user">Usuario (Titular)</MenuItem>
                                    <MenuItem value="admin">Administrador</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button type="submit" variant="contained" startIcon={<AddIcon />} fullWidth>Añadir</Button>
                            </Grid>
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>

            <Typography variant="h6" gutterBottom>Titulares Existentes</Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre Completo</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {accounts.map((acc) => (
                                <TableRow key={acc.id} hover>
                                    <TableCell>{acc.full_name}</TableCell>
                                    <TableCell>{acc.username}</TableCell>
                                    <TableCell>
                                        <Chip label={acc.role} color={acc.role === 'admin' ? 'secondary' : 'primary'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenEditDialog(acc)}>
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(acc.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Confirmar Eliminación Permanente</DialogTitle>
                <DialogContent>
                    {deleteDialogError && <Alert severity="error" sx={{ mb: 2 }}>{deleteDialogError}</Alert>}
                    <DialogContentText sx={{ mb: 2 }}>
                        Esta acción es irreversible. Para confirmar, por favor ingrese su contraseña de administrador.
                        Se eliminará la cuenta del titular y <b>todos</b> sus datos asociados (asesores, clientes, productos, cotizaciones, etc.).
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="password"
                        label="Su Contraseña de Administrador"
                        type="password"
                        fullWidth
                        variant="standard"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteAccount} color="error">Eliminar Permanentemente</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Account Dialog */}
            {editFormState && (
                <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
                    <DialogTitle>Editar Cuenta de Titular</DialogTitle>
                    <Box component="form" onSubmit={handleUpdateAccount}>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                name="full_name"
                                label="Nombre Completo"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={editFormState.full_name}
                                onChange={handleEditFormChange}
                                required
                            />
                            <TextField
                                margin="dense"
                                name="username"
                                label="Username"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={editFormState.username}
                                onChange={handleEditFormChange}
                                required
                            />
                            <TextField
                                margin="dense"
                                select
                                name="role"
                                label="Rol"
                                fullWidth
                                value={editFormState.role}
                                onChange={handleEditFormChange}
                            >
                                <MenuItem value="user">Usuario (Titular)</MenuItem>
                                <MenuItem value="admin">Administrador</MenuItem>
                            </TextField>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseEditDialog}>Cancelar</Button>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogActions>
                    </Box>
                </Dialog>
            )}
        </Container>
    );
}

export default Accounts;