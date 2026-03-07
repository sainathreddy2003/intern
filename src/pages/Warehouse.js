import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Alert
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import DeleteIcon from '@mui/icons-material/Delete';
import { warehouseAPI, returnsAPI, inventoryAPI, itemsAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const emptyWarehouseForm = {
    name: '',
    code: '',
    location: '',
    description: '',
    status: 'ACTIVE'
};

const emptyManualForm = {
    barcode: '',
    productName: '',
    platform: 'MANUAL',
    sku: '',
    qty: '',
    costPrice: '',
    sellingPrice: '',
    entryDate: new Date().toISOString().slice(0, 10),
    notes: ''
};

const Warehouse = () => {
    const queryClient = useQueryClient();
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openManualModal, setOpenManualModal] = useState(false);
    const [formData, setFormData] = useState(emptyWarehouseForm);
    const [manualForm, setManualForm] = useState(emptyManualForm);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [platformFilter, setPlatformFilter] = useState('ALL');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [warehouseToDelete, setWarehouseToDelete] = useState(null);

    const { data: warehousesData, isLoading } = useQuery(
        'warehouses',
        () => warehouseAPI.getWarehouses(),
        { staleTime: 60 * 1000 }
    );

    const warehouses = Array.isArray(warehousesData?.data) ? warehousesData.data : [];

    // Fetch returns depending on the selected platform filter
    const { data: returnsData, isLoading: returnsLoading } = useQuery(
        ['warehouse_returns', selectedWarehouse?.id, platformFilter],
        () => returnsAPI.getReturns({
            warehouseId: selectedWarehouse?.id,
            platform: platformFilter
        }),
        {
            enabled: !!selectedWarehouse,
            staleTime: 10 * 1000,
        }
    );

    const { data: lowStockItemsData, isLoading: lowStockLoading } = useQuery(
        'warehouse_low_stock_items',
        () => inventoryAPI.getLowStockItems(),
        { staleTime: 2 * 60 * 1000 }
    );

    const createMutation = useMutation(
        (payload) => warehouseAPI.createWarehouse(payload),
        {
            onSuccess: () => {
                toast.success('Warehouse created successfully');
                setOpenAddModal(false);
                setFormData(emptyWarehouseForm);
                queryClient.invalidateQueries('warehouses');
            },
            onError: (error) => {
                toast.error(error?.message || 'Failed to create warehouse');
            }
        }
    );

    const handleCreate = () => {
        if (!formData.name.trim()) {
            toast.error('Warehouse Name is required');
            return;
        }
        createMutation.mutate(formData);
    };

    const manualEntryMutation = useMutation(
        (payload) => warehouseAPI.addManualEntry(payload),
        {
            onSuccess: () => {
                toast.success('Manual entry added successfully');
                setOpenManualModal(false);
                setManualForm(emptyManualForm);
                queryClient.invalidateQueries(['warehouse_returns', selectedWarehouse?.id]);
            },
            onError: (error) => {
                toast.error(error?.message || 'Failed to add manual entry');
            }
        }
    );

    const barcodeLookupMutation = useMutation(
        (barcode) => itemsAPI.getItemByBarcode(barcode),
        {
            onSuccess: (response) => {
                const item = response?.data || {};
                if (!item?.item_name) {
                    toast.error('Item not found for this barcode');
                    return;
                }

                setManualForm((prev) => ({
                    ...prev,
                    barcode: item.barcode || prev.barcode,
                    productName: item.item_name || prev.productName,
                    sku: item.item_code || item.barcode || prev.sku,
                    costPrice: String(
                        item.purchase_price ?? item.cost_per_qty ?? item.cost ?? prev.costPrice ?? ''
                    ),
                    sellingPrice: String(
                        item.selling_price ?? item.sale_price ?? prev.sellingPrice ?? ''
                    ),
                    platform: 'WEBSITE'
                }));
                toast.success('Item details auto-filled from website items');
            },
            onError: (error) => {
                toast.error(error?.message || 'Barcode not found in website items');
            }
        }
    );

    const handleBarcodeLookup = () => {
        const barcode = String(manualForm.barcode || '').trim();
        if (!barcode) {
            toast.error('Enter barcode to fetch item details');
            return;
        }
        barcodeLookupMutation.mutate(barcode);
    };

    const handleManualEntry = () => {
        if (!manualForm.productName.trim() || !manualForm.sku.trim() || !manualForm.qty) {
            toast.error('Product Name, SKU, and Quantity are required');
            return;
        }
        manualEntryMutation.mutate({
            ...manualForm,
            warehouseId: selectedWarehouse.id
        });
    };

    const deleteMutation = useMutation(
        (id) => warehouseAPI.deleteWarehouse(id),
        {
            onSuccess: () => {
                toast.success('Warehouse deleted successfully');
                setDeleteConfirmOpen(false);
                setWarehouseToDelete(null);
                queryClient.invalidateQueries('warehouses');
            },
            onError: (error) => {
                toast.error(error?.message || 'Failed to delete warehouse');
            }
        }
    );

    const handleDelete = () => {
        if (warehouseToDelete) {
            deleteMutation.mutate(warehouseToDelete.id || warehouseToDelete._id);
        }
    };

    const handleCardClick = (warehouse) => {
        setSelectedWarehouse(warehouse);
    };

    const renderWarehouseList = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#18120a' }}>
                    Warehouse Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddModal(true)}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 14px 0 rgba(245, 138, 7, 0.39)',
                        fontWeight: 700,
                    }}
                >
                    Add Warehouse
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <Typography color="text.secondary">Loading warehouses...</Typography>
                </Box>
            ) : warehouses.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 8,
                        mt: 4,
                        borderRadius: 4,
                        border: '1px dashed #f1d4ac',
                        bgcolor: 'rgba(255, 255, 255, 0.5)'
                    }}
                >
                    <Box sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: '#ffe2bb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3
                    }}>
                        <LocationOnIcon sx={{ fontSize: 40, color: '#f58a07' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#4a2b10', mb: 1 }}>
                        No Warehouses Found
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center', maxWidth: 400 }}>
                        Get started by creating your first warehouse to manage inventory across your various locations.
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenAddModal(true)}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 700, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                    >
                        Create Premium Warehouse
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={4}>
                    {warehouses.map((wh) => (
                        <Grid item xs={12} sm={6} md={4} key={wh.id || wh._id}>
                            <Card
                                onClick={() => handleCardClick(wh)}
                                sx={{
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                    overflow: 'visible',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    borderRadius: 3,
                                    border: '1px solid #f1d4ac',
                                    bgcolor: '#ffffff',
                                    '&:hover': {
                                        transform: 'translateY(-6px)',
                                        boxShadow: '0 20px 40px rgba(245, 138, 7, 0.12)',
                                        borderColor: '#f58a07'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#18120a' }}>
                                            {wh.name}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip
                                                label={wh.status}
                                                size="small"
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.75rem',
                                                    height: 24,
                                                    bgcolor: wh.status === 'ACTIVE' ? '#e8f5e9' : '#f5f5f5',
                                                    color: wh.status === 'ACTIVE' ? '#2e7d32' : '#757575',
                                                    border: `1px solid ${wh.status === 'ACTIVE' ? '#c8e6c9' : '#e0e0e0'}`
                                                }}
                                            />
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWarehouseToDelete(wh);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                size="small"
                                                sx={{
                                                    color: '#d32f2f',
                                                    bgcolor: '#ffebee',
                                                    '&:hover': { bgcolor: '#ffcdd2' }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#6f5c4a', fontWeight: 600 }}>
                                        <LocationOnIcon sx={{ fontSize: 18, mr: 0.5, color: '#f58a07' }} />
                                        {wh.location || 'Location not specified'}
                                    </Typography>
                                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: '#8d7966', maxWidth: '60%' }}>
                                            {wh.description ? (wh.description.length > 40 ? `${wh.description.substring(0, 40)}...` : wh.description) : 'No description provided.'}
                                        </Typography>
                                        <Typography variant="subtitle2" sx={{
                                            bgcolor: '#fff0dd',
                                            color: '#c96a00',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: 1.5,
                                            fontWeight: 700,
                                            letterSpacing: 0.5
                                        }}>
                                            {wh.code}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Add Warehouse Dialog */}
            <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Add New Warehouse
                    <IconButton onClick={() => setOpenAddModal(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Warehouse Name *"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Code (Auto-generated if empty)"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                multiline
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={formData.status}
                                    label="Status"
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <MenuItem value="ACTIVE">Active</MenuItem>
                                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAddModal(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} variant="contained" disabled={createMutation.isLoading}>
                        {createMutation.isLoading ? 'Saving...' : 'Save Warehouse'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}>
                    Confirm Delete
                </DialogTitle>
                <DialogContent dividers>
                    <Typography>
                        Are you sure you want to delete <strong>{warehouseToDelete?.name}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This action cannot be undone. Associated inventory and returns might be affected depending on server logic.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        variant="contained"
                        color="error"
                        disabled={deleteMutation.isLoading}
                        disableElevation
                    >
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete Warehouse'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );

    const renderWarehouseDetail = () => {
        const returnsList = Array.isArray(returnsData?.data?.returns) ? returnsData.data.returns : [];
        const lowStockItems = Array.isArray(lowStockItemsData?.data)
            ? lowStockItemsData.data
            : Array.isArray(lowStockItemsData?.data?.items)
                ? lowStockItemsData.data.items
                : Array.isArray(lowStockItemsData)
                    ? lowStockItemsData
                    : [];

        // Aggregate incoming returned stock by item code/barcode
        const aggregatedStock = {};
        returnsList.forEach(ret => {
            (ret.items || []).forEach(item => {
                const key = item.itemId || item.code || item.barcode || 'UNKNOWN';
                if (!aggregatedStock[key]) {
                    aggregatedStock[key] = {
                        name: item.itemName,
                        code: item.code || item.barcode,
                        returned: 0
                    };
                }
                aggregatedStock[key].returned += Number(item.qty || 0);
            });
        });

        const stockLines = Object.values(aggregatedStock);
        const lowStockLookup = new Map(
            lowStockItems.map((item) => [
                String(item.item_id || item.id || item.code || item.barcode || item.item_name || '').toLowerCase(),
                item
            ])
        );

        return (
            <Box sx={{ width: '100%', animation: 'fadeIn 0.3s ease-in-out' }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => setSelectedWarehouse(null)} sx={{ mr: 2, bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#f5f5f5' } }}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                {selectedWarehouse.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {selectedWarehouse.code} • {selectedWarehouse.location || 'No location'}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControl size="small" sx={{ minWidth: 220, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                            <InputLabel>Platform Filter</InputLabel>
                            <Select
                                value={platformFilter}
                                label="Platform Filter"
                                onChange={(e) => setPlatformFilter(e.target.value)}
                            >
                                <MenuItem value="ALL">All Platforms</MenuItem>
                                <MenuItem value="AMAZON">Amazon</MenuItem>
                                <MenuItem value="FLIPKART">Flipkart</MenuItem>
                                <MenuItem value="MEESHO">Meesho</MenuItem>
                                <MenuItem value="WEBSITE">Website</MenuItem>
                                <MenuItem value="MANUAL">Manual</MenuItem>
                            </Select>
                        </FormControl>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenManualModal(true)}
                            color="primary"
                            disableElevation
                            sx={{
                                fontWeight: 600,
                                borderRadius: 2,
                                py: 1,
                                px: 3,
                                boxShadow: '0 4px 12px rgba(220, 118, 51, 0.25)',
                                '&:hover': { boxShadow: '0 6px 16px rgba(220, 118, 51, 0.4)' }
                            }}
                        >
                            Manual Entry
                        </Button>
                    </Box>

                    {!lowStockLoading && (
                        <Alert
                            severity={lowStockItems.length > 0 ? 'warning' : 'success'}
                            sx={{ width: '100%', borderRadius: 2, mb: 1 }}
                        >
                            {lowStockItems.length > 0
                                ? `Low Stock Notification: ${lowStockItems.length} item(s) need restocking. This is also visible on the main dashboard.`
                                : 'Low Stock Notification: No low-stock items right now.'}
                        </Alert>
                    )}

                    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Product</TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Code</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Returned (Incoming)</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Outgoing</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>Available Stock</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {returnsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading...</TableCell>
                                    </TableRow>
                                ) : stockLines.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                                            <Box sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.50',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 3,
                                                boxShadow: 'inset 0 0 0 1px rgba(220, 118, 51, 0.1)'
                                            }}>
                                                <BusinessIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                                                No returned products found for this platform.
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Adjust the platform filter or check back later.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stockLines.map((line, idx) => {
                                        const lineKeyByCode = String(line.code || '').toLowerCase();
                                        const lineKeyByName = String(line.name || '').toLowerCase();
                                        const lowStockItem = lowStockLookup.get(lineKeyByCode) || lowStockLookup.get(lineKeyByName);

                                        return (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ fontWeight: 500 }}>{line.name}</TableCell>
                                            <TableCell>{line.code}</TableCell>
                                            <TableCell align="right">
                                                <Chip
                                                    label={`+${Number(line.returned).toFixed(2)}`}
                                                    size="small"
                                                    color="success"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell align="right">0.00</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                                                    <span>{Number(line.returned).toFixed(2)}</span>
                                                    {lowStockItem ? (
                                                        <Chip
                                                            label="Low Stock"
                                                            size="small"
                                                            color="warning"
                                                            variant="outlined"
                                                        />
                                                    ) : null}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Manual Entry Dialog */}
                <Dialog open={openManualModal} onClose={() => setOpenManualModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Add Manual Entry
                        <IconButton onClick={() => setOpenManualModal(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Barcode (Website Item) *"
                                    value={manualForm.barcode}
                                    onChange={(e) => setManualForm({ ...manualForm, barcode: e.target.value })}
                                    onBlur={handleBarcodeLookup}
                                    helperText="Enter barcode to auto-fill item details"
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={handleBarcodeLookup}
                                    disabled={barcodeLookupMutation.isLoading}
                                    sx={{ height: 56 }}
                                >
                                    {barcodeLookupMutation.isLoading ? 'Fetching...' : 'Auto Fill'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    fullWidth
                                    label="Product Name *"
                                    value={manualForm.productName}
                                    onChange={(e) => setManualForm({ ...manualForm, productName: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl fullWidth>
                                    <InputLabel>Platform</InputLabel>
                                    <Select
                                        value={manualForm.platform}
                                        label="Platform"
                                        onChange={(e) => setManualForm({ ...manualForm, platform: e.target.value })}
                                    >
                                        <MenuItem value="MANUAL">Manual</MenuItem>
                                        <MenuItem value="AMAZON">Amazon</MenuItem>
                                        <MenuItem value="FLIPKART">Flipkart</MenuItem>
                                        <MenuItem value="MEESHO">Meesho</MenuItem>
                                        <MenuItem value="WEBSITE">Website</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="SKU / Product ID *"
                                    value={manualForm.sku}
                                    onChange={(e) => setManualForm({ ...manualForm, sku: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Quantity *"
                                    value={manualForm.qty}
                                    onChange={(e) => setManualForm({ ...manualForm, qty: e.target.value })}
                                    inputProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Cost Price"
                                    value={manualForm.costPrice}
                                    onChange={(e) => setManualForm({ ...manualForm, costPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Selling Price"
                                    value={manualForm.sellingPrice}
                                    onChange={(e) => setManualForm({ ...manualForm, sellingPrice: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    type="date"
                                    label="Date of Entry"
                                    InputLabelProps={{ shrink: true }}
                                    value={manualForm.entryDate}
                                    onChange={(e) => setManualForm({ ...manualForm, entryDate: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Notes"
                                    multiline
                                    rows={2}
                                    value={manualForm.notes}
                                    onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenManualModal(false)} color="inherit">
                            Cancel
                        </Button>
                        <Button onClick={handleManualEntry} variant="contained" disabled={manualEntryMutation.isLoading}>
                            {manualEntryMutation.isLoading ? 'Saving...' : 'Save Entry'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%', p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
            {selectedWarehouse ? renderWarehouseDetail() : renderWarehouseList()}
        </Box>
    );
};

export default Warehouse;
