import React, { useState } from 'react';
import apiClient from '../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
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
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

const statusColors = {
    draft: 'default',
    sent: 'primary',
    accepted: 'success',
    rejected: 'error',
};

const statusTranslations = {
    draft: 'Borrador',
    sent: 'Enviada',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
};

// Fetcher function for useQuery
const fetchQuotations = async () => {
    const { data } = await apiClient.get('/quotations/');
    return data;
};

function Quotations() {
    const queryClient = useQueryClient();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    // Fetch quotations with useQuery
    const { data: quotations = [], isLoading, isError, error } = useQuery({ queryKey: ['quotations'], queryFn: fetchQuotations });

    // Mutation for deleting a quotation
    const deleteQuotationMutation = useMutation({
        mutationFn: (quotationId) => apiClient.delete(`/quotations/${quotationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            setFeedback({ type: 'success', message: 'Cotización eliminada con éxito.' });
            handleCloseDeleteDialog();
        },
        onError: () => {
            setFeedback({ type: 'error', message: 'No se pudo eliminar la cotización.' });
        },
    });

    const handleOpenDeleteDialog = (id) => {
        setQuotationToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQuotationToDelete(null);
    };

    const handleDeleteQuotation = () => {
        if (quotationToDelete) {
            deleteQuotationMutation.mutate(quotationToDelete);
        }
    };

    const handleViewPdf = async (id) => {
        try {
            const response = await apiClient.get(`/quotations/${id}/pdf`, {
                responseType: 'blob', // Important
            });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("Error fetching PDF:", error);
            setFeedback({ type: 'error', message: 'No se pudo generar el PDF.' });
        }
    };

    return (
        <div className="page-fade-in">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 0 }, mb: 4 }}>
                <Typography variant="h4" component="h1">
                    Gestión de Cotizaciones
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={RouterLink}
                    to="/quotations/new"
                >
                    Crear Cotización
                </Button>
            </Box>

            <Snackbar open={!!feedback.message} autoHideDuration={5000} onClose={() => setFeedback({ type: '', message: '' })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert onClose={() => setFeedback({ type: '', message: '' })} severity={feedback.type || 'info'} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : isError ? (
                <Alert severity="error">{error.message || 'No se pudieron cargar las cotizaciones.'}</Alert>
            ) : (
                <>
                    {/* Vista CARD en mobile */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {quotations.map(q => (
                            <Paper key={q.id} sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700}>{q.quotation_number}</Typography>
                                        <Typography variant="body2" color="text.secondary">{q.client.name}</Typography>
                                    </Box>
                                    <Chip label={statusTranslations[q.status] || q.status} color={statusColors[q.status] || 'default'} size="small" />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                                    <Typography variant="subtitle1" fontWeight={700} color="primary">${q.total.toFixed(2)}</Typography>
                                    <Box>
                                        <IconButton component={RouterLink} to={`/quotations/${q.id}/edit`} size="small"><EditIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleViewPdf(q.id)} size="small"><PictureAsPdfIcon fontSize="small" /></IconButton>
                                        <IconButton onClick={() => handleOpenDeleteDialog(q.id)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        ))}
                    </Box>

                    {/* Vista TABLA en desktop */}
                    <TableContainer component={Paper} sx={{ overflowX: 'auto', display: { xs: 'none', md: 'block' } }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>N° Cotización</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {quotations.map(q => (
                                    <TableRow key={q.id} hover>
                                        <TableCell>{q.quotation_number}</TableCell>
                                        <TableCell>{q.client.name}</TableCell>
                                        <TableCell>{new Date(q.created_date).toLocaleDateString()}</TableCell>
                                        <TableCell>${q.total.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Chip label={statusTranslations[q.status] || q.status} color={statusColors[q.status] || 'default'} size="small" />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton component={RouterLink} to={`/quotations/${q.id}/edit`}><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleViewPdf(q.id)}><PictureAsPdfIcon /></IconButton>
                                            <IconButton onClick={() => handleOpenDeleteDialog(q.id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
            >
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Está seguro de que desea eliminar esta cotización? Esta acción no se puede deshacer.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
                    <Button onClick={handleDeleteQuotation} color="error" disabled={deleteQuotationMutation.isPending}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Quotations;
