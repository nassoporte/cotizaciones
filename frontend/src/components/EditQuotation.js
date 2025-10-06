import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    TextField,
    Button,
    Paper,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Checkbox,
    Autocomplete,
    CircularProgress,
    Alert,
    MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const statusOptions = [
    { value: 'draft', label: 'Borrador' },
    { value: 'sent', label: 'Enviada' },
    { value: 'accepted', label: 'Aceptada' },
    { value: 'rejected', label: 'Rechazada' },
];

function EditQuotation() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);

    const [quotationData, setQuotationData] = useState(null);
    const [items, setItems] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [clientsRes, productsRes, usersRes, quotationRes] = await Promise.all([
                    apiClient.get('/clients/'),
                    apiClient.get('/products/'),
                    apiClient.get('/users/'),
                    apiClient.get(`/quotations/${id}`)
                ]);

                const allClients = clientsRes.data;
                const allProducts = productsRes.data;
                const allUsers = usersRes.data;
                const qData = quotationRes.data;

                setClients(allClients);
                setProducts(allProducts);
                setUsers(allUsers);

                const clientObj = allClients.find(c => c.id === qData.client.id) || null;
                const userObj = allUsers.find(u => u.id === qData.user.id) || null;

                setQuotationData({
                    ...qData,
                    client: clientObj,
                    user: userObj,
                    valid_until_date: qData.valid_until_date.split('T')[0],
                });

                setItems(qData.items.map(item => ({
                    product_id: item.product_id, // Use the direct ID
                    description: item.description,
                    unit_price: item.unit_price,
                    quantity: item.quantity,
                    is_taxable: item.is_taxable,
                })));

            } catch (err) {
                console.error("Error fetching data:", err);
                setError('No se pudieron cargar los datos de la cotización.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleQuotationChange = (field, value) => {
        setQuotationData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddItem = () => {
        setItems([...items, { product_id: null, description: '', unit_price: 0, quantity: 1, is_taxable: true }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];

        if (field === 'product') {
            if (value) {
                newItems[index]['product_id'] = value.id;
                newItems[index]['description'] = value.description;
                newItems[index]['unit_price'] = value.price;
            } else {
                newItems[index]['product_id'] = null;
                newItems[index]['description'] = '';
                newItems[index]['unit_price'] = 0;
            }
        } else {
            newItems[index][field] = value;
        }
        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const { subtotal, totalTax, total } = useMemo(() => {
        const taxPercentage = quotationData ? quotationData.tax_percentage : 0;
        const subtotal = items.reduce((acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)), 0);
        const taxableAmount = items.reduce((acc, item) => item.is_taxable ? acc + (Number(item.unit_price) * Number(item.quantity)) : acc, 0);
        const totalTax = taxableAmount * (Number(taxPercentage) / 100);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    }, [items, quotationData?.tax_percentage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!quotationData.client || !quotationData.user || items.length === 0) {
            setSubmitError('Por favor, complete todos los campos requeridos: Cliente, Asesor y al menos un item.');
            return;
        }

        const updatedQuotationData = {
            client_id: quotationData.client.id,
            user_id: quotationData.user.id,
            valid_until_date: quotationData.valid_until_date,
            tax_percentage: parseFloat(quotationData.tax_percentage),
            status: quotationData.status,
            items: items.filter(item => item.product_id).map(item => ({
                product_id: item.product_id,
                description: item.description,
                unit_price: parseFloat(item.unit_price),
                quantity: parseInt(item.quantity, 10),
                is_taxable: item.is_taxable,
            }))
        };

        try {
            await apiClient.put(`/quotations/${id}`, updatedQuotationData);
            navigate('/quotations');
        } catch (error) {
            console.error("Error updating quotation:", error);
            setSubmitError('Error al actualizar la cotización. Por favor, intente de nuevo.');
        }
    };

    if (loading) {
        return <Container><Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box></Container>;
    }

    if (error) {
        return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
    }

    if (!quotationData) {
        return null; // Or a not found component
    }

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Editar Cotización N°{quotationData.quotation_number}
            </Typography>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} sx={{ width: '30%' }}>
                            <Autocomplete
                                options={clients}
                                getOptionLabel={(option) => option.name}
                                value={quotationData.client}
                                onChange={(event, newValue) => handleQuotationChange('client', newValue)}
                                renderInput={(params) => <TextField {...params} label="Cliente" required />}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: '30%' }}>
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => option.full_name}
                                value={quotationData.user}
                                onChange={(event, newValue) => handleQuotationChange('user', newValue)}
                                renderInput={(params) => <TextField {...params} label="Asesor de Venta" required />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Válido Hasta"
                                type="date"
                                value={quotationData.valid_until_date}
                                onChange={(e) => handleQuotationChange('valid_until_date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                label="Estado"
                                value={quotationData.status}
                                onChange={(e) => handleQuotationChange('status', e.target.value)}
                                fullWidth
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Typography variant="h6" gutterBottom>Items</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '30%' }}>Producto</TableCell>
                                    <TableCell>Descripción</TableCell>
                                    <TableCell sx={{ width: '10%' }}>Cantidad</TableCell>
                                    <TableCell sx={{ width: '15%' }}>Precio Unitario</TableCell>
                                    <TableCell>Impuesto</TableCell>
                                    <TableCell>Total</TableCell>
                                    <TableCell align="right">Acción</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Autocomplete
                                                options={products}
                                                getOptionLabel={(option) => option.name}
                                                value={products.find(p => String(p.id) === String(item.product_id)) || null}
                                                onChange={(e, newValue) => handleItemChange(index, 'product', newValue)}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        variant="outlined"
                                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                                    />
                                                )}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <TextField
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <TextField
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                inputProps={{ min: 1 }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <TextField
                                                type="number"
                                                value={item.unit_price}
                                                onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                InputProps={{ startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box> }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Checkbox
                                                checked={item.is_taxable}
                                                onChange={(e) => handleItemChange(index, 'is_taxable', e.target.checked)}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}</TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }} align="right">
                                            <IconButton onClick={() => handleRemoveItem(index)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button startIcon={<AddIcon />} onClick={handleAddItem} sx={{ mt: 2 }}>
                        Añadir Item
                    </Button>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                        <Box sx={{ width: { xs: '100%', md: '40%' } }}>
                            <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body1">Subtotal:</Typography>
                                    <Typography variant="body1">${subtotal.toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body1">Impuesto (%):</Typography>
                                    <TextField
                                        type="number"
                                        size="small"
                                        value={quotationData.tax_percentage}
                                        onChange={(e) => handleQuotationChange('tax_percentage', e.target.value)}
                                        sx={{ width: '65px', ml: 3 }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="body1">Total Impuesto:</Typography>
                                    <Typography variant="body1">${totalTax.toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                                    <Typography variant="h6">TOTAL:</Typography>
                                    <Typography variant="h6">${total.toFixed(2)}</Typography>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                    
                    {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<CancelIcon />}
                            onClick={() => navigate('/quotations')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            startIcon={<SaveIcon />}
                        >
                            Guardar Cambios
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default EditQuotation;
