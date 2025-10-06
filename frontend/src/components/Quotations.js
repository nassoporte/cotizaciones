import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
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
    Alert
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

function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [quotationToDelete, setQuotationToDelete] = useState(null);

    useEffect(() => {
        fetchQuotations();
    }, []);

    const fetchQuotations = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/quotations/');
            setQuotations(response.data);
            setError('');
        } catch (error) {
            console.error("Error fetching quotations:", error);
            setError('No se pudieron cargar las cotizaciones.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDeleteDialog = (id) => {
        setQuotationToDelete(id);
        setOpenDeleteDialog(true);
    };

    const handleCloseDeleteDialog = () => {
        setOpenDeleteDialog(false);
        setQuotationToDelete(null);
    };

    const handleDeleteQuotation = async () => {
        if (!quotationToDelete) return;
        try {
            await apiClient.delete(`/quotations/${quotationToDelete}`);
            fetchQuotations(); // Refresh the list
            handleCloseDeleteDialog();
        } catch (error) {
            console.error("Error deleting quotation:", error);
            setError('No se pudo eliminar la cotización.');
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
            setError('No se pudo generar el PDF.');
        }
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <TableContainer component={Paper}>
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
                                        <IconButton onClick={() => handleOpenDeleteDialog(q.id)} color="error" sx={{ ml: 2 }}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
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
                    <Button onClick={handleDeleteQuotation} color="error">Eliminar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default Quotations;
