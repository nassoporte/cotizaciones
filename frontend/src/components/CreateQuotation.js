import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
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
    Icon,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

function CreateQuotation() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    
    const [clientId, setClientId] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [items, setItems] = useState([]);
    const [taxPercentage, setTaxPercentage] = useState(16);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [clientsRes, productsRes, usersRes] = await Promise.all([
                    apiClient.get('/clients/'),
                    apiClient.get('/products/'),
                    apiClient.get('/users/')
                ]);
                setClients(clientsRes.data);
                setProducts(productsRes.data);
                setUsers(usersRes.data);
                if (usersRes.data.length > 0) {
                    // You might want to set a default or let the user choose
                    // setSelectedUserId(usersRes.data[0]); 
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError('No se pudieron cargar los datos necesarios para crear la cotización.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddItem = () => {
        setItems([...items, { product_id: '', description: '', unit_price: 0, quantity: 1, is_taxable: true }]);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'product') {
            if (value) {
                newItems[index]['product_id'] = value.id;
                newItems[index]['description'] = value.description;
                newItems[index]['unit_price'] = value.price;
            } else {
                newItems[index]['product_id'] = '';
                newItems[index]['description'] = '';
                newItems[index]['unit_price'] = 0;
            }
        }
        setItems(newItems);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const { subtotal, totalTax, total } = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (Number(item.unit_price) * Number(item.quantity)), 0);
        const taxableAmount = items.reduce((acc, item) => item.is_taxable ? acc + (Number(item.unit_price) * Number(item.quantity)) : acc, 0);
        const totalTax = taxableAmount * (Number(taxPercentage) / 100);
        const total = subtotal + totalTax;
        return { subtotal, totalTax, total };
    }, [items, taxPercentage]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        if (!clientId || !selectedUserId || items.length === 0) {
            setSubmitError('Por favor, complete todos los campos requeridos: Cliente, Asesor y al menos un item.');
            return;
        }

        const quotationData = {
            client_id: clientId.id,
            user_id: selectedUserId.id,
            valid_until_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            tax_percentage: parseInt(taxPercentage, 10),
            items: items.map(item => ({
                product_id: item.product_id,
                description: item.description,
                unit_price: parseFloat(item.unit_price),
                quantity: parseInt(item.quantity, 10),
                is_taxable: item.is_taxable,
            }))
        };

        try {
            await apiClient.post('/quotations/', quotationData);
            navigate('/quotations');
        } catch (error) {
            console.error("Error creating quotation:", error);
            setSubmitError('Error al guardar la cotización. Por favor, intente de nuevo.');
        }
    };

    if (loading) {
        return <Container><Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box></Container>;
    }

    if (error) {
        return <Container><Alert severity="error" sx={{ mt: 2 }}>{error}</Alert></Container>;
    }

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Crear Nueva Cotización
            </Typography>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3} mb={4}>
                        <Grid item xs={12} sx={{ width: '40%' }}>
                            <Autocomplete
                                options={clients}
                                getOptionLabel={(option) => option.name}
                                value={clientId}
                                onChange={(event, newValue) => setClientId(newValue)}
                                renderInput={(params) => <TextField {...params} label="Cliente" required />}
                            />
                        </Grid>
                        <Grid item xs={12} sx={{ width: '40%' }}>
                            <Autocomplete
                                options={users}
                                getOptionLabel={(option) => option.full_name}
                                value={selectedUserId}
                                onChange={(event, newValue) => setSelectedUserId(newValue)}
                                renderInput={(params) => <TextField {...params} label="Asesor de Venta" required />}
                            />
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
                                                value={products.find(p => p.id === item.product_id) || null}
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
                                        value={taxPercentage}
                                        onChange={(e) => setTaxPercentage(e.target.value)}
                                        sx={{ width: '65px' }}
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
                            Guardar Cotización
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default CreateQuotation;