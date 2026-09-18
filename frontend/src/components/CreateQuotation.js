import React, { useState, useMemo } from 'react';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Container, Typography, Grid, TextField, Button, Paper, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Checkbox, Autocomplete, CircularProgress, Alert,
    InputAdornment, Tooltip, createFilterOptions, Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddBoxIcon from '@mui/icons-material/AddBox';
import QuickAddClientModal from './QuickAddClientModal';
import QuickAddProductModal from './QuickAddProductModal';

const filterClients = createFilterOptions();
const filterProducts = createFilterOptions();

const fetchClients  = async () => (await apiClient.get('/clients/')).data;
const fetchProducts = async () => (await apiClient.get('/products/')).data;
const fetchUsers    = async () => (await apiClient.get('/users/')).data;

function CreateQuotation() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Data fetching con react-query
    const { data: clients  = [], isLoading: loadingC } = useQuery({ queryKey: ['clients'],  queryFn: fetchClients  });
    const { data: products = [], isLoading: loadingP } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
    const { data: users    = [], isLoading: loadingU } = useQuery({ queryKey: ['users'],    queryFn: fetchUsers    });

    const loading = loadingC || loadingP || loadingU;

    // Form state
    const [clientId, setClientId]         = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [items, setItems]               = useState([]);
    const [taxPercentage, setTaxPercentage] = useState(16);
    const [validityDays, setValidityDays] = useState(30);
    const [submitError, setSubmitError]   = useState('');

    // Quick-add modal state
    const [clientModal, setClientModal]   = useState({ open: false, inputValue: '' });
    const [productModal, setProductModal] = useState({ open: false, inputValue: '', rowIndex: null });

    // ---- Items logic ----
    const handleAddItem = () => {
        setItems(prev => [...prev, { product_id: '', product: null, description: '', unit_price: 0, quantity: 1, is_taxable: true }]);
    };

    const handleItemChange = (index, field, value) => {
        setItems(prev => {
            const next = [...prev];
            if (field === 'product') {
                if (value) {
                    next[index] = { ...next[index], product: value, product_id: value.id, description: value.description || '', unit_price: value.price };
                } else {
                    next[index] = { ...next[index], product: null, product_id: '', description: '', unit_price: 0 };
                }
            } else {
                next[index] = { ...next[index], [field]: value };
            }
            return next;
        });
    };

    const handleRemoveItem = (index) => setItems(prev => prev.filter((_, i) => i !== index));

    // ---- Totals ----
    const { subtotal, totalTax, total } = useMemo(() => {
        const sub = items.reduce((acc, it) => acc + Number(it.unit_price) * Number(it.quantity), 0);
        const taxable = items.reduce((acc, it) => it.is_taxable ? acc + Number(it.unit_price) * Number(it.quantity) : acc, 0);
        const tax = taxable * (Number(taxPercentage) / 100);
        return { subtotal: sub, totalTax: tax, total: sub + tax };
    }, [items, taxPercentage]);

    // ---- Submit ----
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        if (!clientId || !selectedUserId || items.length === 0) {
            setSubmitError('Complete todos los campos: Cliente, Asesor y al menos un ítem.');
            return;
        }
        try {
            await apiClient.post('/quotations/', {
                client_id: clientId.id,
                user_id: selectedUserId.id,
                validity_days: parseInt(validityDays, 10),
                tax_percentage: parseFloat(taxPercentage),
                items: items.map(it => ({
                    product_id: it.product_id,
                    description: it.description,
                    unit_price: parseFloat(it.unit_price),
                    quantity: parseInt(it.quantity, 10),
                    is_taxable: it.is_taxable,
                })),
            });
            navigate('/quotations');
        } catch {
            setSubmitError('Error al guardar la cotización. Intente de nuevo.');
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ flex: 1 }}>
                    Nueva Cotización
                </Typography>
                <Chip label={`${items.length} ítem(s)`} color="primary" variant="outlined" size="small" />
            </Box>

            <Paper elevation={0} variant="outlined" sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {/* Header fields */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Cliente con alta rápida */}
                        <Box sx={{ flex: '1 1 40%', minWidth: '280px' }}>
                            <Autocomplete
                                value={clientId}
                                onChange={(_, newValue) => {
                                    if (newValue && typeof newValue === 'object' && newValue._isNew) {
                                        setClientModal({ open: true, inputValue: newValue.inputValue });
                                    } else {
                                        setClientId(newValue);
                                    }
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filterClients(options, params);
                                    const { inputValue } = params;
                                    if (inputValue.trim() && !options.some(o => o.name.toLowerCase() === inputValue.toLowerCase())) {
                                        filtered.push({ _isNew: true, inputValue, name: `+ Crear cliente: "${inputValue}"` });
                                    }
                                    return filtered;
                                }}
                                options={clients}
                                getOptionLabel={(o) => typeof o === 'string' ? o : o.name}
                                isOptionEqualToValue={(o, v) => o.id === v?.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cliente"
                                        required
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <Tooltip title="Crear nuevo cliente">
                                                        <IconButton size="small" onClick={() => setClientModal({ open: true, inputValue: '' })} sx={{ mr: 0.5 }}>
                                                            <PersonAddIcon fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props} key={option._isNew ? 'new-client' : option.id}>
                                        {option._isNew
                                            ? <Box sx={{ color: 'primary.main', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}><PersonAddIcon fontSize="small" />{option.name}</Box>
                                            : option.name
                                        }
                                    </li>
                                )}
                            />
                        </Box>

                        {/* Asesor */}
                        <Box sx={{ flex: '1 1 30%', minWidth: '220px' }}>
                            <Autocomplete
                                options={users}
                                getOptionLabel={(o) => o.full_name || o.email}
                                value={selectedUserId}
                                onChange={(_, v) => setSelectedUserId(v)}
                                renderInput={(params) => <TextField {...params} label="Asesor de Venta" required />}
                            />
                        </Box>

                        {/* Días validez */}
                        <Box sx={{ flex: '1 1 11%', minWidth: '95px' }}>
                            <TextField
                                label="Días de Validez"
                                type="number"
                                value={validityDays}
                                onChange={(e) => setValidityDays(e.target.value)}
                                fullWidth required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>

                        {/* Impuesto */}
                        <Box sx={{ flex: '1 1 11%', minWidth: '95px' }}>
                            <TextField
                                label="IVA (%)"
                                type="number"
                                value={taxPercentage}
                                onChange={(e) => setTaxPercentage(e.target.value)}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                        </Box>
                    </Box>

                    {/* Items table */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="h6" sx={{ flex: 1 }}>Ítems de la Cotización</Typography>
                        <Button startIcon={<AddIcon />} onClick={handleAddItem} variant="outlined" size="small" sx={{ borderRadius: 50 }}>
                            Añadir Ítem
                        </Button>
                    </Box>

                    {items.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                Aún no has añadido ítems a esta cotización.
                            </Typography>
                            <Button startIcon={<AddIcon />} onClick={handleAddItem} variant="contained" sx={{ borderRadius: 50 }}>
                                Añadir primer ítem
                            </Button>
                        </Paper>
                    ) : (
                        <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ width: { xs: '40%', md: '28%' } }}>Producto / Servicio</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Descripción</TableCell>
                                        <TableCell sx={{ width: '9%' }}>Cant.</TableCell>
                                        <TableCell sx={{ width: { xs: '20%', md: '13%' } }}>Precio Unit.</TableCell>
                                        <TableCell sx={{ width: '6%', display: { xs: 'none', sm: 'table-cell' } }} align="center">
                                            <Tooltip title="¿Aplica IVA?"><span>IVA</span></Tooltip>
                                        </TableCell>
                                        <TableCell sx={{ width: '10%' }} align="right">Total</TableCell>
                                        <TableCell sx={{ width: '5%' }} />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index} hover>
                                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                                                <Autocomplete
                                                    value={item.product || null}
                                                    onChange={(_, newValue) => {
                                                        if (newValue && newValue._isNew) {
                                                            setProductModal({ open: true, inputValue: newValue.inputValue, rowIndex: index });
                                                        } else {
                                                            handleItemChange(index, 'product', newValue);
                                                        }
                                                    }}
                                                    filterOptions={(options, params) => {
                                                        const filtered = filterProducts(options, params);
                                                        const { inputValue } = params;
                                                        if (inputValue.trim() && !options.some(o => o.name.toLowerCase() === inputValue.toLowerCase())) {
                                                            filtered.push({ _isNew: true, inputValue, name: `+ Crear: "${inputValue}"` });
                                                        }
                                                        return filtered;
                                                    }}
                                                    options={products}
                                                    getOptionLabel={(o) => typeof o === 'string' ? o : o.name}
                                                    isOptionEqualToValue={(o, v) => o.id === v?.id}
                                                    size="small"
                                                    renderInput={(params) => (
                                                        <TextField {...params} placeholder="Buscar o crear..." variant="outlined" />
                                                    )}
                                                    renderOption={(props, option) => (
                                                        <li {...props} key={option._isNew ? `new-${index}` : option.id}>
                                                            {option._isNew
                                                                ? <Box sx={{ color: 'primary.main', fontWeight: 700, display: 'flex', gap: 0.5 }}><AddBoxIcon fontSize="small" />{option.name}</Box>
                                                                : option.name
                                                            }
                                                        </li>
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1, display: { xs: 'none', md: 'table-cell' } }}>
                                                <TextField
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    size="small" fullWidth variant="outlined"
                                                    placeholder="Descripción detallada..."
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                                                <TextField
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    size="small" fullWidth variant="outlined"
                                                    inputProps={{ min: 1 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1 }}>
                                                <TextField
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                                    size="small" fullWidth variant="outlined"
                                                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1, display: { xs: 'none', sm: 'table-cell' } }} align="center">
                                                <Checkbox
                                                    checked={item.is_taxable}
                                                    onChange={(e) => handleItemChange(index, 'is_taxable', e.target.checked)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1 }} align="right">
                                                <Typography variant="body2" fontWeight={600}>
                                                    ${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none', py: 1 }} align="center">
                                                <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {/* Totals */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Paper elevation={0} variant="outlined" sx={{ p: 2.5, minWidth: 280, borderRadius: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                                <Typography variant="body2" fontWeight={600}>${subtotal.toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">IVA ({taxPercentage}%):</Typography>
                                <Typography variant="body2" fontWeight={600}>${totalTax.toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="h6">TOTAL:</Typography>
                                <Typography variant="h6" color="primary">${total.toFixed(2)}</Typography>
                            </Box>
                        </Paper>
                    </Box>

                    {submitError && <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{submitError}</Alert>}

                    {/* Actions */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                        <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} onClick={() => navigate('/quotations')} sx={{ borderRadius: 50 }}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon />} sx={{ borderRadius: 50 }}>
                            Guardar Cotización
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Quick-add modals */}
            <QuickAddClientModal
                open={clientModal.open}
                initialName={clientModal.inputValue}
                onClose={() => setClientModal({ open: false, inputValue: '' })}
                onCreated={(newClient) => {
                    queryClient.invalidateQueries({ queryKey: ['clients'] });
                    setClientId(newClient);
                    setClientModal({ open: false, inputValue: '' });
                }}
            />
            <QuickAddProductModal
                open={productModal.open}
                initialName={productModal.inputValue}
                onClose={() => setProductModal({ open: false, inputValue: '', rowIndex: null })}
                onCreated={(newProduct) => {
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                    if (productModal.rowIndex !== null) {
                        handleItemChange(productModal.rowIndex, 'product', newProduct);
                    }
                    setProductModal({ open: false, inputValue: '', rowIndex: null });
                }}
            />
        </Container>
    );
}

export default CreateQuotation;