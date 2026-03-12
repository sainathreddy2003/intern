import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
} from '@mui/material';
import Inventory from '@mui/icons-material/Inventory';
import Assessment from '@mui/icons-material/Assessment';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Warning from '@mui/icons-material/Warning';
import Category from '@mui/icons-material/Category';
import LocalOffer from '@mui/icons-material/LocalOffer';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { itemsAPI, inventoryAPI, purchaseAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const ItemsMaster = () => {
  const resolveUnitByItemType = (itemType) => {
    const normalized = String(itemType || '').toUpperCase();
    if (normalized === 'FABRIC') return 'Meter';
    if (normalized === 'PRODUCT') return 'Piece';
    if (normalized === 'OTHER') return 'Piece';
    return 'Piece';
  };

  const getErrorMessage = (error, fallback) =>
    (typeof error === 'string' ? error : '') ||
    error?.message ||
    error?.error ||
    error?.details ||
    error?.response?.data?.message ||
    fallback;

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    search: '',
    groupId: '',
    lowStock: false,
    expiring: false,
  });
  const [inventoryFilters, setInventoryFilters] = useState({
    name: '',
    type: '',
    color: '',
    supplier: '',
    typeSelect: '',
    colorSelect: '',
    supplierSelect: '',
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [priceSnapshot, setPriceSnapshot] = useState({
    currentSellingPrice: 0,
    currentRoi: 0,
    netCost: 0,
  });
  const [newItem, setNewItem] = useState({
    item_name: '',
    item_code: '',
    barcode: '',
    description: '',
    unit_name: 'Piece',
    quantity: '',
    group_id: '',
    item_type: 'GENERAL',
    custom_product_name: '',
    fabric_type: '',
    color: '',
    design: '',
    width_inch: '',
    gsm: '',
    roll_length: '',
    hsn_code: '',
    piece_meter: '',
    cost: '',
    cost_per_qty: '',
    discount_percent: '',
    discount_amount: '',
    tax_amount: '',
    net_cost: '',
    roi_percent: '',
    gross_profit_percent: '',
    selling_price_per_piece: '',
    net_amount: '',
    selling_price: '',
    min_stock_level: '',
    last_purchase_id: '',
    last_purchase_no: '',
    last_purchase_date: '',
    is_active: true,
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const buildCodeFromBarcode = (barcode = '') => {
    const clean = String(barcode).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!clean) return '';
    return `FB-${clean.slice(0, 12)}`;
  };

  // Fetch items with stock
  const { data: itemsData, isLoading: itemsLoading } = useQuery(
    ['items-stock', page, rowsPerPage, filters],
    () => inventoryAPI.getStock({
      page: page + 1,
      limit: rowsPerPage,
      ...filters
    }),
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  // Fetch low stock items
  const { data: lowStockData } = useQuery(
    'low-stock-items',
    inventoryAPI.getLowStockItems,
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch expiring items
  const { data: expiringData } = useQuery(
    'expiring-items',
    () => inventoryAPI.getExpiringItems(30),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch item groups
  const { data: groupsData } = useQuery(
    'item-groups',
    itemsAPI.getItemGroups,
    {
      staleTime: 10 * 60 * 1000,
    }
  );

  const items = itemsData?.data?.items || [];
  const pagination = itemsData?.data?.pagination || {};
  const lowStockItems = lowStockData?.data || [];
  const expiringItems = expiringData?.data || [];
  const groups = groupsData?.data || [];
  const uniqueTypes = [...new Set(items.map((x) => x.fabric_type || '').filter(Boolean))];
  const uniqueColors = [...new Set(items.map((x) => x.color || '').filter(Boolean))];
  const uniqueSuppliers = [...new Set(items.map((x) => x.group_name || x.group || '').filter(Boolean))];

  const filteredInventoryItems = items.filter((item) => {
    const namePass = inventoryFilters.name
      ? `${item.item_name || ''} ${item.item_code || ''} ${item.barcode || ''}`.toLowerCase().includes(inventoryFilters.name.toLowerCase())
      : true;
    const typePass = inventoryFilters.type
      ? (item.fabric_type || '').toLowerCase().includes(inventoryFilters.type.toLowerCase())
      : true;
    const colorPass = inventoryFilters.color
      ? (item.color || '').toLowerCase().includes(inventoryFilters.color.toLowerCase())
      : true;
    const supplierPass = inventoryFilters.supplier
      ? `${item.group_name || item.group || ''}`.toLowerCase().includes(inventoryFilters.supplier.toLowerCase())
      : true;
    const typeSelectPass = inventoryFilters.typeSelect
      ? (item.fabric_type || '') === inventoryFilters.typeSelect
      : true;
    const colorSelectPass = inventoryFilters.colorSelect
      ? (item.color || '') === inventoryFilters.colorSelect
      : true;
    const supplierSelectPass = inventoryFilters.supplierSelect
      ? `${item.group_name || item.group || ''}` === inventoryFilters.supplierSelect
      : true;

    return (
      namePass &&
      typePass &&
      colorPass &&
      supplierPass &&
      typeSelectPass &&
      colorSelectPass &&
      supplierSelectPass
    );
  });

  const inventoryTotalValue = filteredInventoryItems.reduce(
    (sum, item) => sum + Number(item.current_stock || 0) * Number(item.selling_price || 0),
    0
  );
  const resetNewItem = () => {
    setNewItem({
      item_name: '',
      item_code: '',
      barcode: '',
      description: '',
      unit_name: 'Piece',
      quantity: '',
      group_id: '',
      item_type: 'GENERAL',
      custom_product_name: '',
      fabric_type: '',
      color: '',
      design: '',
      width_inch: '',
      gsm: '',
      roll_length: '',
      hsn_code: '',
      piece_meter: '',
      cost: '',
      cost_per_qty: '',
      discount_percent: '',
      discount_amount: '',
      tax_amount: '',
      net_cost: '',
      roi_percent: '',
      gross_profit_percent: '',
      selling_price_per_piece: '',
      net_amount: '',
      selling_price: '',
      min_stock_level: '',
      last_purchase_id: '',
      last_purchase_no: '',
      last_purchase_date: '',
      is_active: true,
    });
  };

  const createItemMutation = useMutation(
    (itemData) => itemsAPI.createItem(itemData),
    {
      onSuccess: () => {
        toast.success('Item created successfully');
        setAddDialogOpen(false);
        resetNewItem();
        queryClient.invalidateQueries('items-stock');
        queryClient.invalidateQueries('low-stock-items');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to create item'));
      },
    }
  );

  const updateItemMutation = useMutation(
    ({ id, itemData }) => itemsAPI.updateItem(id, itemData),
    {
      onSuccess: () => {
        toast.success('Item updated successfully');
        setEditDialogOpen(false);
        setEditingItemId(null);
        resetNewItem();
        queryClient.invalidateQueries('items-stock');
        queryClient.invalidateQueries('low-stock-items');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to update item'));
      },
    }
  );

  const deleteItemMutation = useMutation(
    (id) => itemsAPI.deleteItem(id),
    {
      onSuccess: () => {
        toast.success('Item deleted successfully');
        queryClient.invalidateQueries('items-stock');
        queryClient.invalidateQueries('low-stock-items');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, 'Failed to delete item'));
      },
    }
  );

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(0);
  };

  const handleNewItemChange = (key, value) => {
    if (key === 'barcode') {
      const barcode = String(value || '').trim();
      setNewItem((prev) => ({
        ...prev,
        barcode,
        item_code: buildCodeFromBarcode(barcode),
      }));
      return;
    }
    if (key === 'item_type') {
      const nextType = String(value || '').toUpperCase();
      setNewItem((prev) => ({
        ...prev,
        item_type: nextType,
        unit_name: resolveUnitByItemType(nextType),
      }));
      return;
    }
    setNewItem((prev) => ({ ...prev, [key]: value }));
  };

  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toCompact2 = (value) => {
    const rounded = Number(toNumber(value).toFixed(2));
    return rounded === 0 ? '' : String(rounded);
  };

  const recalculatePriceFields = (nextSellingPrice, nextRoiPercent) => {
    const netCost = toNumber(newItem.net_cost || priceSnapshot.netCost);
    const pieceMeter = Math.max(0, toNumber(newItem.piece_meter) || 1);
    const sellingPrice = Math.max(0, toNumber(nextSellingPrice));
    const roiPercent = Math.max(0, toNumber(nextRoiPercent));
    const grossProfitPercent =
      sellingPrice > 0 ? ((sellingPrice - netCost) / sellingPrice) * 100 : 0;
    const sellingPricePerPiece = pieceMeter > 0 ? sellingPrice * pieceMeter : sellingPrice;

    setNewItem((prev) => ({
      ...prev,
      selling_price: toCompact2(sellingPrice),
      roi_percent: toCompact2(roiPercent),
      gross_profit_percent: toCompact2(grossProfitPercent),
      selling_price_per_piece: toCompact2(sellingPricePerPiece),
    }));
  };

  const handleNewSellingPriceChange = (value) => {
    const sellingPrice = Math.max(0, toNumber(value));
    const netCost = toNumber(newItem.net_cost || priceSnapshot.netCost);
    const roiPercent = netCost > 0 ? ((sellingPrice - netCost) / netCost) * 100 : 0;
    recalculatePriceFields(sellingPrice, roiPercent);
  };

  const handleNewRoiChange = (value) => {
    const roiPercent = Math.max(0, toNumber(value));
    const netCost = toNumber(newItem.net_cost || priceSnapshot.netCost);
    const sellingPrice = netCost * (1 + roiPercent / 100);
    recalculatePriceFields(sellingPrice, roiPercent);
  };

  const handleCreateItem = () => {
    if (!newItem.item_name.trim() || !newItem.barcode.trim()) {
      toast.error('Fabric name and barcode are required');
      return;
    }
    if (String(newItem.item_type || '').toUpperCase() === 'OTHER' && !String(newItem.custom_product_name || '').trim()) {
      toast.error('Enter Product Name is required for Product Type "Other"');
      return;
    }

    const payload = {
      ...newItem,
      item_code: buildCodeFromBarcode(newItem.barcode),
      group: newItem.group_id || 'General',
      group_id: newItem.group_id || '',
      item_type: newItem.item_type || 'GENERAL',
      width_inch: Number(newItem.width_inch || 0),
      gsm: Number(newItem.gsm || 0),
      roll_length: Number(newItem.roll_length || 0),
      selling_price: Number(newItem.selling_price || 0),
      stock: 0,
      current_stock: 0,
      unit_name: resolveUnitByItemType(newItem.item_type),
      unit: resolveUnitByItemType(newItem.item_type),
      min_stock_level: Number(newItem.min_stock_level || 0),
      is_active: true,
    };

    createItemMutation.mutate(payload);
  };

  const handleEditItem = (item) => {
    setEditingItemId(item.item_id);
    setNewItem({
      item_name: item.item_name || '',
      item_code: item.item_code || '',
      barcode: item.barcode || '',
      description: item.description || '',
      unit_name: item.unit_name || item.unit || resolveUnitByItemType(item.item_type || 'GENERAL'),
      quantity: String(item.current_stock ?? item.stock ?? ''),
      group_id: item.group_id || item.group_name || '',
      item_type: item.item_type || 'GENERAL',
      custom_product_name: item.custom_product_name || '',
      fabric_type: item.fabric_type || '',
      color: item.color || '',
      design: item.design || '',
      width_inch: String(item.width_inch ?? 0),
      gsm: String(item.gsm ?? 0),
      roll_length: String(item.roll_length ?? 0),
      hsn_code: item.hsn_code || '',
      piece_meter: String(item.piece_meter ?? 0),
      cost: String(item.cost ?? 0),
      cost_per_qty: String(item.cost_per_qty ?? 0),
      discount_percent: String(item.discount_percent ?? 0),
      discount_amount: String(item.discount_amount ?? 0),
      tax_amount: String(item.tax_amount ?? 0),
      net_cost: String(item.net_cost ?? 0),
      roi_percent: String(item.roi_percent ?? 0),
      gross_profit_percent: String(item.gross_profit_percent ?? 0),
      selling_price_per_piece: String(item.selling_price_per_piece ?? 0),
      net_amount: String(item.net_amount ?? 0),
      selling_price: String(item.selling_price ?? 0),
      min_stock_level: String(item.min_stock_level ?? 0),
      last_purchase_id: item.last_purchase_id || '',
      last_purchase_no: item.last_purchase_no || '',
      last_purchase_date: item.last_purchase_date || '',
      is_active: item.is_active !== false,
    });
    setPriceSnapshot({
      currentSellingPrice: Number(item.selling_price || 0),
      currentRoi: Number(item.roi_percent || 0),
      netCost: Number(item.net_cost || 0),
    });
    setEditDialogOpen(true);
  };

  const resolvePurchaseIdForItem = async (item) => {
    const directPurchaseId = String(item.last_purchase_id || '').trim();
    if (directPurchaseId) return directPurchaseId;

    const searchToken = String(item.barcode || item.item_code || item.item_name || '').trim();
    if (!searchToken) return '';

    const response = await purchaseAPI.getOrders({
      limit: 25,
      search: searchToken,
      status: 'ACTIVE',
      purchaseType: 'PURCHASE',
    });
    const orders = Array.isArray(response?.data?.orders) ? response.data.orders : [];

    const itemId = String(item.item_id || '').trim();
    const barcode = String(item.barcode || '').trim().toLowerCase();
    const code = String(item.item_code || '').trim().toLowerCase();

    const matchedOrder = orders.find((order) =>
      Array.isArray(order.items) &&
      order.items.some((line) => {
        const lineItemId = String(line.itemId || line.item_id || '').trim();
        const lineBarcode = String(line.barcode || '').trim().toLowerCase();
        const lineCode = String(line.code || '').trim().toLowerCase();
        return (
          (itemId && lineItemId && lineItemId === itemId) ||
          (barcode && lineBarcode && lineBarcode === barcode) ||
          (code && lineCode && lineCode === code)
        );
      })
    );

    return String(matchedOrder?.purchase_id || matchedOrder?.id || matchedOrder?._id || '').trim();
  };

  const openQuantityEditInPurchase = async (item) => {
    try {
      const purchaseId = await resolvePurchaseIdForItem(item);
      if (!purchaseId) {
        const prefillItem = {
          item_id: String(item.item_id || '').trim(),
          barcode: String(item.barcode || '').trim(),
          item_code: String(item.item_code || '').trim(),
          item_name: String(item.item_name || '').trim(),
          piece_meter: String(item.unit_name || item.piece_meter || '1').trim(),
        };
        const prefillJson = encodeURIComponent(JSON.stringify(prefillItem));
        navigate(`/purchase?prefillItem=${prefillJson}&t=${Date.now()}`);
        toast.success('Opened new purchase bill with item prefilled. Enter quantity and save.');
        return;
      }
      setEditDialogOpen(false);
      setEditingItemId(null);
      navigate(`/purchase?editPurchaseId=${encodeURIComponent(purchaseId)}&t=${Date.now()}`);
      toast.success('Opened linked purchase bill. Update quantity there and save.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to open linked purchase bill'));
    }
  };

  const handleUpdateItem = () => {
    if (!editingItemId) return;

    if (!newItem.item_name.trim() || !newItem.barcode.trim()) {
      toast.error('Fabric name and barcode are required');
      return;
    }
    if (String(newItem.item_type || '').toUpperCase() === 'OTHER' && !String(newItem.custom_product_name || '').trim()) {
      toast.error('Enter Product Name is required for Product Type "Other"');
      return;
    }

    const payload = {
      ...newItem,
      item_code: buildCodeFromBarcode(newItem.barcode),
      group: newItem.group_id || 'General',
      group_id: newItem.group_id || '',
      item_type: newItem.item_type || 'GENERAL',
      width_inch: Number(newItem.width_inch || 0),
      gsm: Number(newItem.gsm || 0),
      roll_length: Number(newItem.roll_length || 0),
      selling_price: Number(newItem.selling_price || 0),
      stock: Number(newItem.quantity || 0),
      unit_name: resolveUnitByItemType(newItem.item_type),
      unit: resolveUnitByItemType(newItem.item_type),
      min_stock_level: Number(newItem.min_stock_level || 0),
      is_active: true,
    };

    updateItemMutation.mutate({ id: editingItemId, itemData: payload });
  };

  const handleDeleteItem = (item) => {
    const confirmed = window.confirm(`Delete item "${item.item_name}"?`);
    if (!confirmed) return;
    deleteItemMutation.mutate(item.item_id);
  };

  const getStockStatus = (item) => {
    const stock = item.current_stock || 0;
    const minStock = item.min_stock_level || 0;

    if (stock === 0) return { color: 'error', label: 'Out of Stock' };
    if (stock <= minStock) return { color: 'warning', label: 'Low Stock' };
    return { color: 'success', label: 'In Stock' };
  };

  const renderItemsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Textile Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your textile inventory with ease
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialogOpen(true)}>
          Add New Fabric
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, border: '1px solid #ffcc80', borderRadius: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search fabrics by name or description..."
              value={inventoryFilters.name}
              onChange={(e) => setInventoryFilters((p) => ({ ...p, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search colors..."
              value={inventoryFilters.color}
              onChange={(e) => setInventoryFilters((p) => ({ ...p, color: e.target.value }))}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: 3 }}>
        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Barcode</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Fabric</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Category</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>HSN</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Color</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Piece/M</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Cost/Qty</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Cost</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Disc %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Disc Amt</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tax %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tax Amt</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Net Cost</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>ROI %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Gross %</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Selling</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Sell/Pc</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Net Amt</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Stock</TableCell>
                <TableCell align="right" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Valuation</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemsLoading ? (
                <TableRow>
                  <TableCell colSpan={19} align="center" sx={{ py: 4 }}>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Loading inventory...</Typography>
                  </TableCell>
                </TableRow>
              ) : filteredInventoryItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={19} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" color="text.secondary">No fabrics found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventoryItems.map((item, idx) => (
                  <TableRow key={item.item_id} sx={{ '&:hover': { bgcolor: 'rgba(255, 152, 0, 0.08)' }, borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.2s' }}>
                    <TableCell sx={{ py: 1.5, fontWeight: 500, color: '#333', fontSize: '0.8125rem' }}>{item.barcode || '-'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{item.item_name}</Typography>
                      <Typography variant="caption" sx={{ color: '#9e9e9e', letterSpacing: '0.3px' }}>{item.item_code}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip label={item.item_type === 'FABRIC' || item.fabric_type ? 'FABRICS' : (item.group_name || item.group || item.item_type || '-')} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, color: '#666', fontSize: '0.8125rem' }}>{item.hsn_code || '-'}</TableCell>
                    <TableCell sx={{ py: 1.5, color: '#666', fontSize: '0.8125rem' }}>{item.color || '-'}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>{Number(item.piece_meter || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.cost_per_qty || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.cost || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>{Number(item.discount_percent || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.discount_amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>{Number(item.tax_percentage || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.tax_amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: '0.8125rem' }}>₹{Number(item.net_cost || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>{Number(item.roi_percent || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>{Number(item.gross_profit_percent || 0).toFixed(2)}%</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, color: '#2e7d32', fontSize: '0.8125rem' }}>₹{Number(item.selling_price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.selling_price_per_piece || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontSize: '0.8125rem' }}>₹{Number(item.net_amount || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 700, fontSize: '0.875rem', color: Number(item.current_stock || 0) < 0 ? '#fff' : Number(item.current_stock || 0) <= Number(item.min_stock_level || 0) ? '#d32f2f' : '#1976d2', bgcolor: Number(item.current_stock || 0) < 0 ? '#d32f2f' : 'transparent', borderRadius: Number(item.current_stock || 0) < 0 ? '4px' : '0' }}>{Number(item.current_stock || 0).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.5, fontWeight: 600, fontSize: '0.8125rem' }}>₹{Number((item.current_stock || 0) * (item.cost || 0)).toFixed(2)}</TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <IconButton size="small" onClick={() => handleEditItem(item)} sx={{ color: '#ff9800', mr: 0.5 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item)}
                        disabled={deleteItemMutation.isLoading}
                        sx={{ color: '#d32f2f' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderLowStockTab = () => (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Items that need to be restocked soon
        </Alert>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Low Stock Items ({lowStockItems.length})
        </Typography>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Item</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Current Stock</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Min Stock</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Shortage</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Unit</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lowStockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography color="text.secondary">
                      No items with low stock
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lowStockItems.map((item) => (
                  <TableRow key={item.item_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {item.item_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.item_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error" fontWeight="bold">
                        {item.current_stock || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.min_stock_level || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="error">
                        {Math.max(0, (item.min_stock_level || 0) - (item.current_stock || 0))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.unit_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => toast('Create purchase order from Purchase page')}
                      >
                        Order Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderExpiringTab = () => (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Items expiring within the next 30 days
        </Alert>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Expiring Items ({expiringItems.length})
        </Typography>

        <TableContainer sx={{ overflowX: 'auto', width: '100%' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Item</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Batch</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Expiry Date</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Quantity</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Supplier</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Days Left</TableCell>
                <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 600, py: 1.5, fontSize: '0.8125rem', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expiringItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">
                      No items expiring soon
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                expiringItems.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpired = daysLeft < 0;
                  const isCritical = daysLeft <= 7;

                  return (
                    <TableRow key={item.batch_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {item.item_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.item_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {item.batch_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(item.expiry_date), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.supplier_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={isExpired ? 'Expired' : `${daysLeft} days`}
                          color={isExpired ? 'error' : isCritical ? 'warning' : 'info'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => toast('Return flow is not implemented yet')}
                        >
                          Return
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Inventory sx={{ mr: 1, verticalAlign: 'middle' }} />
          Inventory Management
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Category sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Total Items</Typography>
              </Box>
              <Typography variant="h4">{pagination.total || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                Active items in inventory
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">In Stock</Typography>
              </Box>
              <Typography variant="h4">{items.filter(item => (item.current_stock || 0) > (item.min_stock_level || 0)).length}</Typography>
              <Typography variant="caption" color="text.secondary">
                Items with sufficient stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Low Stock</Typography>
              </Box>
              <Typography variant="h4">{lowStockItems.length}</Typography>
              <Typography variant="caption" color="text.secondary">
                Items need restocking
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Items" />
          <Tab label={`Low Stock (${lowStockItems.length})`} />
          <Tab label={`Expiring (${expiringItems.length})`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderItemsTab()}
      {tabValue === 1 && renderLowStockTab()}
      {tabValue === 2 && renderExpiringTab()}

      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Fabric</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fabric Name *"
                value={newItem.item_name}
                onChange={(e) => handleNewItemChange('item_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Barcode *"
                value={newItem.barcode}
                onChange={(e) => handleNewItemChange('barcode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={newItem.item_type}
                  label="Item Type"
                  onChange={(e) => handleNewItemChange('item_type', e.target.value)}
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="FABRIC">Fabric</MenuItem>
                  <MenuItem value="PRODUCT">Product</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newItem.group_id}
                  label="Category"
                  onChange={(e) => handleNewItemChange('group_id', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={newItem.quantity}
                InputProps={{ readOnly: true }}
                helperText="Quantity is controlled from Purchase Bill after item creation"
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  value={newItem.unit_name}
                  label="Unit"
                  disabled
                >
                  <MenuItem value={resolveUnitByItemType(newItem.item_type)}>{resolveUnitByItemType(newItem.item_type)}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newItem.item_type === 'OTHER' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Enter Product Name"
                  value={newItem.custom_product_name}
                  onChange={(e) => handleNewItemChange('custom_product_name', e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Stock Level"
                value={newItem.min_stock_level}
                onChange={(e) => handleNewItemChange('min_stock_level', e.target.value)}
                inputProps={{ min: 0, step: '1' }}
              />
            </Grid>
            {newItem.item_type === 'FABRIC' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fabric Type"
                    value={newItem.fabric_type}
                    onChange={(e) => handleNewItemChange('fabric_type', e.target.value)}
                    placeholder="Cotton, Linen, Silk"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={newItem.color}
                    onChange={(e) => handleNewItemChange('color', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Design/Pattern"
                    value={newItem.design}
                    onChange={(e) => handleNewItemChange('design', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Width (inch)"
                    value={newItem.width_inch}
                    onChange={(e) => handleNewItemChange('width_inch', e.target.value)}
                    inputProps={{ min: 0, step: '0.1' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="GSM"
                    value={newItem.gsm}
                    onChange={(e) => handleNewItemChange('gsm', e.target.value)}
                    inputProps={{ min: 0, step: '1' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Roll Length (m)"
                    value={newItem.roll_length}
                    onChange={(e) => handleNewItemChange('roll_length', e.target.value)}
                    inputProps={{ min: 0, step: '0.1' }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              resetNewItem();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateItem}
            disabled={createItemMutation.isLoading}
          >
            {createItemMutation.isLoading ? 'Saving...' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Item Name *"
                value={newItem.item_name}
                onChange={(e) => handleNewItemChange('item_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Barcode *"
                value={newItem.barcode}
                onChange={(e) => handleNewItemChange('barcode', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={newItem.item_type}
                  label="Item Type"
                  onChange={(e) => handleNewItemChange('item_type', e.target.value)}
                >
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="FABRIC">Fabric</MenuItem>
                  <MenuItem value="PRODUCT">Product</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select value={newItem.unit_name} label="Unit" disabled>
                  <MenuItem value={resolveUnitByItemType(newItem.item_type)}>{resolveUnitByItemType(newItem.item_type)}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newItem.item_type === 'OTHER' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Enter Product Name"
                  value={newItem.custom_product_name}
                  onChange={(e) => handleNewItemChange('custom_product_name', e.target.value)}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newItem.group_id}
                  label="Category"
                  onChange={(e) => handleNewItemChange('group_id', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.group_id} value={group.group_id}>
                      {group.group_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity"
                value={newItem.quantity}
                InputProps={{ readOnly: true }}
                helperText="Quantity is controlled from Purchase Bill"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: { xs: 0, md: 1.2 } }}
                onClick={() =>
                  openQuantityEditInPurchase({
                    item_id: editingItemId,
                    barcode: newItem.barcode,
                    item_code: newItem.item_code,
                    item_name: newItem.item_name,
                    last_purchase_id: newItem.last_purchase_id,
                  })
                }
              >
                Open Purchase Bill To Update Qty
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffaf2', borderColor: '#ffcc80' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                  Smart Price Update
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Current Selling"
                      value={priceSnapshot.currentSellingPrice.toFixed(2)}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Current ROI %"
                      value={priceSnapshot.currentRoi.toFixed(2)}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="New Selling Price"
                      value={newItem.selling_price}
                      onChange={(e) => handleNewSellingPriceChange(e.target.value)}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="New ROI %"
                      value={newItem.roi_percent}
                      onChange={(e) => handleNewRoiChange(e.target.value)}
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Change either new selling price or new ROI. The other field updates automatically from Net Cost.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Stock Level"
                value={newItem.min_stock_level}
                onChange={(e) => handleNewItemChange('min_stock_level', e.target.value)}
                inputProps={{ min: 0, step: '1' }}
              />
            </Grid>
            {newItem.item_type === 'FABRIC' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fabric Type"
                    value={newItem.fabric_type}
                    onChange={(e) => handleNewItemChange('fabric_type', e.target.value)}
                    placeholder="Cotton, Linen, Silk"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Color"
                    value={newItem.color}
                    onChange={(e) => handleNewItemChange('color', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Design/Pattern"
                    value={newItem.design}
                    onChange={(e) => handleNewItemChange('design', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Width (inch)"
                    value={newItem.width_inch}
                    onChange={(e) => handleNewItemChange('width_inch', e.target.value)}
                    inputProps={{ min: 0, step: '0.1' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="GSM"
                    value={newItem.gsm}
                    onChange={(e) => handleNewItemChange('gsm', e.target.value)}
                    inputProps={{ min: 0, step: '1' }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Roll Length (m)"
                    value={newItem.roll_length}
                    onChange={(e) => handleNewItemChange('roll_length', e.target.value)}
                    inputProps={{ min: 0, step: '0.1' }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditingItemId(null);
              resetNewItem();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateItem}
            disabled={updateItemMutation.isLoading}
          >
            {updateItemMutation.isLoading ? 'Saving...' : 'Update Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemsMaster;
