import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import PersonAdd from '@mui/icons-material/PersonAdd';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Paid from '@mui/icons-material/Paid';
import AssignmentReturn from '@mui/icons-material/AssignmentReturn';
import Search from '@mui/icons-material/Search';
import Save from '@mui/icons-material/Save';
import Pause from '@mui/icons-material/Pause';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Edit from '@mui/icons-material/Edit';
import Print from '@mui/icons-material/Print';
import Download from '@mui/icons-material/Download';
import Visibility from '@mui/icons-material/Visibility';
import Delete from '@mui/icons-material/Delete';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { itemsAPI, purchaseAPI, suppliersAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const PAYMENT_OPTIONS = ['CASH', 'UPI', 'CARD', 'BANK', 'CREDIT'];
const PIECE_METER_OPTIONS = ['1', '2', '5', '10', 'ROLL'];
const PURCHASE_GRID_COLUMN_DIVIDER = '1px solid #e2e8f0';

const emptyPurchaseForm = {
  supplier_id: '',
  supplier_code: '',
  supplier_name: '',
  invoice_number: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  payment_mode: 'CASH',
  paid_amount: '',
  narration: '',
};

const emptyPaymentForm = {
  amount: '',
  mode: 'CASH',
  note: '',
};

const emptySupplierForm = {
  supplier_code: '',
  supplier_name: '',
  mobile: '',
  email: '',
  address: '',
  gst_no: '',
  supplying_fabric: '',
  supply_quantity: '',
};

const emptyReturnForm = {
  purchaseNo: '',
  returnQty: '',
  reason: 'Return',
  error: '',
  original: null,
};

const createEmptyRow = () => ({
  code: '',
  color: '',
  hsnCode: '',
  description: '',
  qty: '',
  shrinkage: '',
  availableQty: '',
  pieceMeter: '1',
  costInputMode: 'cost',
  costPerQty: '',
  cost: '',
  discountInputMode: 'discountPercent',
  discountPercent: '',
  discountAmount: '',
  taxInputMode: 'taxPercent',
  taxPercent: '5',
  taxAmount: '',
  sellingInputMode: 'roiPercent',
  netCost: '',
  roiPercent: '',
  grossProfitPercent: '',
  sellingPrice: '',
  mrp: '',
  sellingPricePerPiece: '',
  netAmount: '',
  itemId: '',
  barcode: '',
  itemType: 'FABRIC',
  customProductName: '',
});

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const normalized =
    typeof value === 'string' ? value.replace(/,/g, '').replace(/%/g, '').trim() : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFixed2 = (value) => toNumber(value).toFixed(2);
const toCompact2 = (value) => {
  const rounded = Number(toFixed2(value));
  return rounded === 0 ? '' : String(rounded);
};

const normalizePieceMeterOption = (value) => {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === '3') return '2';
  if (PIECE_METER_OPTIONS.includes(normalized)) {
    return normalized;
  }
  if (normalized === 'ROLLS') {
    return 'ROLL';
  }
  return '1';
};

const getPieceMeterFactor = (value) => {
  const normalized = normalizePieceMeterOption(value);
  return normalized === 'ROLL' ? 1 : toNumber(normalized);
};

const money = (value) =>
  `₹${toNumber(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeDate = (d) => {
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy');
};

const isRowCompletelyEmpty = (row = {}) => {
  return (
    !String(row.code || '').trim() &&
    !String(row.description || '').trim() &&
    toNumber(row.qty) <= 0 &&
    toNumber(row.cost) <= 0
  );
};

const recalculateRow = (row, sourceField = '') => {
  const qty = Math.max(0, toNumber(row.qty));
  const shrinkage = Math.max(0, Math.min(100, toNumber(row.shrinkage)));
  const availableQty = Math.max(0, qty - (qty * shrinkage / 100));

  const pieceMeterOption = normalizePieceMeterOption(row.pieceMeter);
  const pieceMeter = Math.max(0, getPieceMeterFactor(pieceMeterOption));
  let costInputMode = row.costInputMode || 'cost';
  if (sourceField === 'cost') {
    costInputMode = 'cost';
  } else if (sourceField === 'costPerQty') {
    costInputMode = 'costPerQty';
  }

  let cost = Math.max(0, toNumber(row.cost));
  let costPerQty = Math.max(0, toNumber(row.costPerQty));
  if (costInputMode === 'costPerQty' && (sourceField === 'costPerQty' || sourceField === 'qty')) {
    cost = costPerQty * qty;
  } else {
    costPerQty = qty > 0 ? cost / qty : 0;
  }

  let discountInputMode = row.discountInputMode || 'discountPercent';
  if (sourceField === 'discountAmount') {
    discountInputMode = 'discountAmount';
  } else if (sourceField === 'discountPercent') {
    discountInputMode = 'discountPercent';
  }
  let discountPercent = Math.max(0, toNumber(row.discountPercent));
  let discountAmount = Math.max(0, toNumber(row.discountAmount));

  if (discountInputMode === 'discountAmount') {
    discountAmount = Math.min(cost, discountAmount);
    discountPercent = cost > 0 ? (discountAmount / cost) * 100 : 0;
  } else {
    discountPercent = Math.min(100, discountPercent);
    discountAmount = (cost * discountPercent) / 100;
  }

  const taxable = Math.max(0, cost - discountAmount);

  let taxInputMode = row.taxInputMode || 'taxPercent';
  if (sourceField === 'taxAmount') {
    taxInputMode = 'taxAmount';
  } else if (sourceField === 'taxPercent') {
    taxInputMode = 'taxPercent';
  }

  let taxPercent = Math.max(0, toNumber(row.taxPercent));
  let taxAmount = Math.max(0, toNumber(row.taxAmount));
  if (taxInputMode === 'taxAmount') {
    taxPercent = taxable > 0 ? (taxAmount / taxable) * 100 : 0;
  } else {
    taxAmount = (taxable * taxPercent) / 100;
  }

  const netAmount = taxable + taxAmount;
  const netCost = qty > 0 ? netAmount / qty : 0;
  const effectiveCost = availableQty > 0 ? netAmount / availableQty : netCost;

  let sellingInputMode = row.sellingInputMode || 'roiPercent';
  if (sourceField === 'sellingPrice') {
    sellingInputMode = 'sellingPrice';
  } else if (sourceField === 'sellingPricePerPiece') {
    sellingInputMode = 'sellingPricePerPiece';
  } else if (sourceField === 'roiPercent') {
    sellingInputMode = 'roiPercent';
  }

  let roiPercent = Math.max(0, toNumber(row.roiPercent));
  let sellingPrice = Math.max(0, toNumber(row.sellingPrice));
  let sellingPricePerPiece = Math.max(0, toNumber(row.sellingPricePerPiece));

  if (sellingInputMode === 'sellingPrice') {
    roiPercent = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  } else if (sellingInputMode === 'sellingPricePerPiece') {
    sellingPrice = pieceMeter > 0 ? sellingPricePerPiece / pieceMeter : sellingPricePerPiece;
    roiPercent = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / effectiveCost) * 100 : 0;
  } else {
    sellingPrice = effectiveCost * (1 + roiPercent / 100);
  }

  sellingPricePerPiece = pieceMeter > 0 ? sellingPrice * pieceMeter : sellingPrice;
  // MRP includes GST on top of selling (selling is pre-GST business price).
  const mrp = sellingPrice * (1 + taxPercent / 100);

  // Calculate gross profit percent
  const grossProfitPercent = effectiveCost > 0 ? ((sellingPrice - effectiveCost) / sellingPrice) * 100 : 0;

  return {
    ...row,
    pieceMeter: pieceMeterOption,
    costInputMode,
    discountInputMode,
    taxInputMode,
    sellingInputMode,
    cost: toCompact2(cost),
    costPerQty: toCompact2(costPerQty),
    discountPercent: toCompact2(discountPercent),
    discountAmount: toCompact2(discountAmount),
    taxPercent: toCompact2(taxPercent),
    taxAmount: toCompact2(taxAmount),
    netCost: toCompact2(netCost),
    shrinkage: toCompact2(shrinkage),
    availableQty: toCompact2(availableQty),
    roiPercent: toCompact2(roiPercent),
    grossProfitPercent: toCompact2(grossProfitPercent),
    sellingPrice: toCompact2(sellingPrice),
    mrp: toCompact2(mrp),
    sellingPricePerPiece: toCompact2(sellingPricePerPiece),
    netAmount: toCompact2(netAmount),
  };
};

const Purchase = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const inputRefs = useRef({});
  const handledEditPurchaseIdRef = useRef('');
  const handledPrefillItemRef = useRef('');

  const [showExtraColumns, setShowExtraColumns] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    supplierId: '',
    paymentStatus: '',
    fromDate: '',
    toDate: '',
  });
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [rows, setRows] = useState([createEmptyRow()]);
  const [editingHoldId, setEditingHoldId] = useState('');
  const [editingHoldNo, setEditingHoldNo] = useState('');
  const [activeRow, setActiveRow] = useState(null);

  const [openSupplierCreate, setOpenSupplierCreate] = useState(false);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);

  const [payDialog, setPayDialog] = useState({
    open: false,
    rowId: '',
    title: '',
  });
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [returnForm, setReturnForm] = useState(emptyReturnForm);

  const { data: suppliersData } = useQuery('suppliers-purchase', purchaseAPI.getSuppliers, {
    staleTime: 5 * 60 * 1000,
  });
  const suppliers = Array.isArray(suppliersData?.data) ? suppliersData.data : [];

  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['purchase-orders', filters],
    () =>
      purchaseAPI.getOrders({
        limit: 500,
        search: filters.search,
        supplierId: filters.supplierId,
        paymentStatus: filters.paymentStatus,
        status: 'ACTIVE',
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
    { staleTime: 60 * 1000 }
  );

  const purchaseOrders = Array.isArray(ordersData?.data?.orders) ? ordersData.data.orders : [];

  const { data: holdOrdersData, isLoading: holdOrdersLoading } = useQuery(
    ['purchase-hold-orders', filters],
    () =>
      purchaseAPI.getOrders({
        limit: 500,
        search: filters.search,
        supplierId: filters.supplierId,
        paymentStatus: filters.paymentStatus,
        status: 'HOLD',
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
    { staleTime: 60 * 1000 }
  );

  const holdOrders = Array.isArray(holdOrdersData?.data?.orders) ? holdOrdersData.data.orders : [];

  const latestPurchaseContextByCode = useMemo(() => {
    const map = new Map();
    const getOrderTs = (order = {}) => {
      const byPurchaseDate = new Date(order.purchase_date || 0).getTime();
      const byCreatedAt = new Date(order.createdAt || 0).getTime();
      return Math.max(byPurchaseDate || 0, byCreatedAt || 0);
    };

    const register = (keyRaw, context) => {
      const key = String(keyRaw || '').trim().toUpperCase();
      if (!key) return;
      const existing = map.get(key);
      if (!existing || context.ts > existing.ts) {
        map.set(key, context);
      }
    };

    [...purchaseOrders, ...holdOrders].forEach((order) => {
      const ts = getOrderTs(order);
      (Array.isArray(order.items) ? order.items : []).forEach((line) => {
        const code = line.code || line.item_code || '';
        const barcode = line.barcode || '';
        const context = { ts, order, line };
        register(code, context);
        register(barcode, context);
      });
    });

    return map;
  }, [purchaseOrders, holdOrders]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysPurchases = purchaseOrders
      .filter((x) => String(x.purchase_date || '').slice(0, 10) === today)
      .reduce((sum, x) => sum + Number(x.grand_total || 0), 0);
    const supplierDue = purchaseOrders.reduce((sum, x) => sum + Number(x.due_amount || 0), 0);
    const thisMonthPurchases = purchaseOrders.reduce((sum, x) => {
      const d = new Date(x.purchase_date);
      const n = new Date();
      if (d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()) {
        return sum + Number(x.grand_total || 0);
      }
      return sum;
    }, 0);

    return {
      todaysPurchases,
      supplierDue,
      thisMonthPurchases,
      totalPurchaseBills: purchaseOrders.length,
    };
  }, [purchaseOrders]);

  const visibleColumns = useMemo(() => {
    const baseColumns = [
      { key: 'code', label: 'Code', type: 'text' },
      { key: 'description', label: 'Desc', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'qty', label: 'Quantity-Meter', type: 'number' },
      { key: 'shrinkage', label: 'Shrinkage (%)', type: 'number' },
      { key: 'availableQty', label: 'Available Qty', type: 'number', readOnly: true },
      { key: 'pieceMeter', label: 'Piece/Meter', type: 'select' },
      { key: 'costPerQty', label: 'Cost Per Quantity', type: 'number' },
      { key: 'cost', label: 'Cost', type: 'number' },
      { key: 'discountPercent', label: 'Disc %', type: 'number' },
      { key: 'discountAmount', label: 'Disc Amount', type: 'number' },
      { key: 'taxPercent', label: 'Tax %', type: 'number' },
      { key: 'taxAmount', label: 'Tax Amount', type: 'number' },
      { key: 'netCost', label: 'Net Cost/Qty', type: 'number', readOnly: true },
      { key: 'roiPercent', label: 'ROI %', type: 'number' },
      { key: 'sellingPrice', label: 'Selling Price', type: 'number' },
      { key: 'sellingPricePerPiece', label: 'Selling Price/Piece', type: 'number' },
      { key: 'netAmount', label: 'Net Amount', type: 'number', readOnly: true },
    ];

    const extraColumns = [
      { key: 'hsnCode', label: 'HSN Code', type: 'text' },
      { key: 'grossProfitPercent', label: 'Gross Profit %', type: 'number' },
    ];

    return showExtraColumns ? [...baseColumns, ...extraColumns] : baseColumns;
  }, [showExtraColumns]);

  const billRows = useMemo(() => rows.filter((row) => !isRowCompletelyEmpty(row)), [rows]);
  const minVisibleRows = 12;
  const emptyRowsCount = Math.max(0, minVisibleRows - rows.length);
  const hasDraftPurchase = useMemo(() => {
    const hasHeaderData = Boolean(
      String(purchaseForm.supplier_id || '').trim() ||
      String(purchaseForm.supplier_name || '').trim() ||
      String(purchaseForm.supplier_code || '').trim() ||
      String(purchaseForm.invoice_number || '').trim() ||
      String(purchaseForm.paid_amount || '').trim() ||
      String(purchaseForm.narration || '').trim()
    );
    const hasRowData = rows.some((row) => !isRowCompletelyEmpty(row));
    return hasHeaderData || hasRowData;
  }, [purchaseForm, rows]);

  const totals = useMemo(() => {
    return billRows.reduce(
      (acc, row) => {
        acc.totalQty += toNumber(row.qty);
        acc.totalCost += toNumber(row.cost);
        acc.totalDiscount += toNumber(row.discountAmount);
        acc.totalTax += toNumber(row.taxAmount);
        acc.grandNet += toNumber(row.netAmount);
        return acc;
      },
      {
        totalQty: 0,
        totalCost: 0,
        totalDiscount: 0,
        totalTax: 0,
        grandNet: 0,
      }
    );
  }, [billRows]);

  const clearPurchaseBill = useCallback(() => {
    setPurchaseForm(emptyPurchaseForm);
    setRows([createEmptyRow()]);
    setEditingHoldId('');
    setEditingHoldNo('');
  }, []);

  const createOrderMutation = useMutation((payload) => purchaseAPI.createOrder(payload), {
    onSuccess: (_response, payload) => {
      const billStatus = String(payload?.status || 'ACTIVE').toUpperCase();
      toast.success(billStatus === 'HOLD' ? 'Purchase bill held' : 'Purchase bill saved');
      clearPurchaseBill();
      queryClient.invalidateQueries('purchase-orders');
      queryClient.invalidateQueries('purchase-hold-orders');
    },
    onError: (error) => toast.error(error?.message || 'Failed to save purchase'),
  });

  const updateOrderMutation = useMutation(({ id, payload }) => purchaseAPI.updateOrder(id, payload), {
    onSuccess: (_response, variables) => {
      const billStatus = String(variables?.payload?.status || 'ACTIVE').toUpperCase();
      toast.success(billStatus === 'HOLD' ? 'Purchase hold updated' : 'Purchase bill saved');
      clearPurchaseBill();
      queryClient.invalidateQueries('purchase-orders');
      queryClient.invalidateQueries('purchase-hold-orders');
    },
    onError: (error) => toast.error(error?.message || 'Failed to update purchase bill'),
  });

  const paySupplierMutation = useMutation(({ id, payload }) => purchaseAPI.addPayment(id, payload), {
    onSuccess: () => {
      toast.success('Supplier payment recorded');
      setPayDialog({ open: false, rowId: '', title: '' });
      setPaymentForm(emptyPaymentForm);
      queryClient.invalidateQueries('purchase-orders');
    },
    onError: (error) => toast.error(error?.message || 'Failed to record supplier payment'),
  });

  const createSupplierMutation = useMutation((payload) => suppliersAPI.createSupplier(payload), {
    onSuccess: (response) => {
      toast.success('Supplier created');
      const created = response?.data || {};
      setOpenSupplierCreate(false);
      setSupplierForm(emptySupplierForm);
      queryClient.invalidateQueries('suppliers-purchase');

      if (created.supplier_id || created.id) {
        const supplierId = created.supplier_id || created.id;
        setPurchaseForm((prev) => ({
          ...prev,
          supplier_id: supplierId,
          supplier_code: created.supplier_code || prev.supplier_code,
          supplier_name: created.supplier_name || prev.supplier_name,
        }));
      }
    },
    onError: (error) => toast.error(error?.message || 'Failed to create supplier'),
  });

  const createReturnMutation = useMutation(({ id, payload }) => purchaseAPI.createReturn(id, payload), {
    onSuccess: () => {
      toast.success('Return processed');
      setReturnForm(emptyReturnForm);
      setActiveTab(3);
      queryClient.invalidateQueries('purchase-orders');
      queryClient.invalidateQueries('purchase-hold-orders');
    },
    onError: (error) => {
      const message = error?.message || 'Failed to process return';
      setReturnForm((prev) => ({ ...prev, error: message }));
      toast.error(message);
    },
  });

  const deleteHoldOrderMutation = useMutation((id) => purchaseAPI.deleteOrder(id), {
    onSuccess: () => {
      toast.success('Hold bill deleted');
      queryClient.invalidateQueries('purchase-hold-orders');
      queryClient.invalidateQueries('purchase-orders');
    },
    onError: (error) => toast.error(error?.message || 'Failed to delete hold bill'),
  });

  const getOrderTotalQty = useCallback((order = {}) => {
    const items = Array.isArray(order.items) ? order.items : [];
    return items.reduce((sum, item) => {
      const qtyMeter = toNumber(item.qty_meter);
      if (qtyMeter > 0) return sum + qtyMeter;
      return sum + toNumber(item.qty);
    }, 0);
  }, []);

  const getOrderId = (order = {}) => String(order.purchase_id || order.id || order._id || '');

  const openReturnTab = (row = null) => {
    if (row) {
      setReturnForm({
        purchaseNo: row.purchase_no || '',
        returnQty: '',
        reason: 'Return',
        error: '',
        original: row,
      });
    } else {
      setReturnForm(emptyReturnForm);
    }
    setActiveTab(3);
  };

  const mapPurchaseItemToRow = useCallback((item = {}) => {
    const qtyMeter = toNumber(item.qty_meter ?? item.qtyMeter);
    const qty = qtyMeter > 0 ? qtyMeter : toNumber(item.qty ?? item.quantity);
    const amount = toNumber(item.net_amount ?? item.netAmount ?? item.amount);
    const cost = toNumber(item.cost ?? item.total_cost);
    const derivedCost = cost > 0 ? cost : amount;
    const costPerQty = toNumber(item.cost_per_qty ?? item.costPerQty);
    const derivedCostPerQty =
      costPerQty > 0 ? costPerQty : qty > 0 ? derivedCost / qty : 0;
    const discountAmount = toNumber(item.discount_amount ?? item.discountAmount);
    const discountPercent = toNumber(item.discount_percent ?? item.discountPercent);
    const taxAmount = toNumber(item.tax_amount ?? item.taxAmount);
    const taxPercent = toNumber(item.tax_percent ?? item.tax_percentage ?? item.taxPercent ?? item.tax);
    const netCost = toNumber(item.net_cost ?? item.netCost ?? item.rate);
    const sellingPrice = toNumber(item.selling_price ?? item.sellingPrice ?? item.sale_price ?? item.salePrice);
    const mrp = toNumber(item.mrp ?? item.MRP);
    const derivedSellingPrice =
      sellingPrice > 0
        ? sellingPrice
        : mrp > 0
          ? mrp / (1 + taxPercent / 100 || 1)
          : 0;
    const unitType = String(item.unit_type || item.unitType || '').trim().toLowerCase();
    const code = String(item.code || item.item_code || item.itemCode || item.barcode || '').trim();
    const description = String(item.description || item.itemName || item.item_name || '').trim();
    const pieceMeterRaw = item.piece_meter ?? item.pieceMeter ?? '1';
    const row = {
      ...createEmptyRow(),
      code,
      color: String(item.color || '').trim(),
      hsnCode: String(item.hsn_code || item.hsnCode || '').trim(),
      description,
      qty: toCompact2(qty),
      shrinkage: toCompact2(item.shrinkage),
      availableQty: toCompact2(item.available_qty),
      pieceMeter:
        unitType === 'roll' ? 'ROLL' : normalizePieceMeterOption(pieceMeterRaw),
      costInputMode: 'cost',
      costPerQty: toCompact2(derivedCostPerQty),
      cost: toCompact2(derivedCost),
      discountInputMode: 'discountPercent',
      discountPercent: toCompact2(discountPercent),
      discountAmount: toCompact2(discountAmount),
      taxInputMode: 'taxPercent',
      taxPercent: toCompact2(taxPercent),
      taxAmount: toCompact2(taxAmount),
      sellingInputMode: 'roiPercent',
      netCost: toCompact2(netCost),
      roiPercent: toCompact2(item.roi_percent ?? item.roiPercent),
      grossProfitPercent: toCompact2(item.gross_profit_percent ?? item.grossProfitPercent),
      sellingPrice: toCompact2(derivedSellingPrice),
      mrp: toCompact2(item.mrp || (derivedSellingPrice * (1 + taxPercent / 100))),
      sellingPricePerPiece: toCompact2(item.selling_price_per_piece ?? item.sellingPricePerPiece),
      netAmount: toCompact2(amount),
      itemId: String(item.itemId || item.item_id || item.id || '').trim(),
      barcode: String(item.barcode || code).trim(),
      itemType: String(item.item_type || item.itemType || 'FABRIC').trim().toUpperCase(),
      customProductName: String(item.custom_product_name || '').trim(),
    };
    return recalculateRow(row);
  }, []);

  const resumeHoldBill = useCallback(
    (order = {}) => {
      const id = getOrderId(order);
      if (!id) {
        toast.error('Invalid hold bill');
        return;
      }

      const itemRows = Array.isArray(order.items) ? order.items.map((item) => mapPurchaseItemToRow(item)) : [];
      const populatedRows = itemRows.length ? itemRows : [createEmptyRow()];
      const purchaseDateRaw = String(order.purchase_date || '').slice(0, 10);
      const purchaseDate =
        /^\d{4}-\d{2}-\d{2}$/.test(purchaseDateRaw)
          ? purchaseDateRaw
          : new Date().toISOString().slice(0, 10);

      setPurchaseForm({
        supplier_id: String(order.supplier_id || '').trim(),
        supplier_code: String(order.supplier_code || '').trim(),
        supplier_name: String(order.supplier_name || '').trim(),
        invoice_number: String(order.invoice_number || '').trim(),
        purchase_date: purchaseDate,
        payment_mode: String(order.payment_mode || 'CASH').toUpperCase(),
        paid_amount: toCompact2(order.paid_amount),
        narration: String(order.narration || '').trim(),
      });
      setRows(populatedRows);
      setEditingHoldId(id);
      setEditingHoldNo(String(order.purchase_no || '').trim());
      setActiveTab(0);
      toast.success(`Loaded hold bill ${order.purchase_no || ''}`);
    },
    [mapPurchaseItemToRow]
  );

  const deleteHoldBill = useCallback(
    (order = {}) => {
      const id = getOrderId(order);
      if (!id) {
        toast.error('Invalid hold bill');
        return;
      }
      const purchaseNo = String(order.purchase_no || '').trim();
      const confirmed = window.confirm(`Delete hold bill ${purchaseNo || id}?`);
      if (!confirmed) return;
      deleteHoldOrderMutation.mutate(id);
    },
    [deleteHoldOrderMutation]
  );

  const editPurchaseBill = useCallback(
    async (order = {}) => {
      const id = getOrderId(order);
      if (!id) {
        toast.error('Invalid purchase bill');
        return;
      }

      let sourceOrder = order;
      try {
        const response = await purchaseAPI.getOrder(id);
        sourceOrder = response?.data?.data || response?.data || order;
      } catch (error) {
        toast.error(error?.message || 'Failed to load purchase details');
        return;
      }

      const itemRows = Array.isArray(sourceOrder.items)
        ? sourceOrder.items.map((item) => mapPurchaseItemToRow(item))
        : [];
      const populatedRows = itemRows.length ? itemRows : [createEmptyRow()];
      const purchaseDateRaw = String(sourceOrder.purchase_date || '').slice(0, 10);
      const purchaseDate =
        /^\d{4}-\d{2}-\d{2}$/.test(purchaseDateRaw)
          ? purchaseDateRaw
          : new Date().toISOString().slice(0, 10);

      setPurchaseForm({
        supplier_id: String(sourceOrder.supplier_id || '').trim(),
        supplier_code: String(sourceOrder.supplier_code || '').trim(),
        supplier_name: String(sourceOrder.supplier_name || '').trim(),
        invoice_number: String(sourceOrder.invoice_number || '').trim(),
        purchase_date: purchaseDate,
        payment_mode: String(sourceOrder.payment_mode || 'CASH').toUpperCase(),
        paid_amount: toCompact2(sourceOrder.paid_amount),
        narration: String(sourceOrder.narration || '').trim(),
      });
      setRows(populatedRows);
      setEditingHoldId(id);
      setEditingHoldNo(String(sourceOrder.purchase_no || '').trim());
      setActiveTab(0);
      toast.success(`Editing purchase bill ${sourceOrder.purchase_no || ''}`);
    },
    [mapPurchaseItemToRow]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetPurchaseId = String(params.get('editPurchaseId') || '').trim();
    if (!targetPurchaseId) return;
    const requestKey = `${targetPurchaseId}|${String(params.get('t') || '')}`;
    if (handledEditPurchaseIdRef.current === requestKey) return;

    handledEditPurchaseIdRef.current = requestKey;
    purchaseAPI
      .getOrder(targetPurchaseId)
        .then((response) => {
        const order = response?.data?.data || response?.data;
        if (!order) {
          toast.error('Linked purchase bill not found');
          return;
        }
        editPurchaseBill(order);
      })
      .catch((error) => {
        toast.error(error?.message || 'Failed to load linked purchase bill');
      });
  }, [editPurchaseBill, location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefillRaw = String(params.get('prefillItem') || '').trim();
    if (!prefillRaw) return;
    const requestKey = `${prefillRaw}|${String(params.get('t') || '')}`;
    if (handledPrefillItemRef.current === requestKey) return;
    handledPrefillItemRef.current = requestKey;

    try {
      const parsed = JSON.parse(decodeURIComponent(prefillRaw));
      const mappedRow = recalculateRow({
        ...createEmptyRow(),
        code: String(parsed.item_code || parsed.barcode || '').trim(),
        description: String(parsed.item_name || '').trim(),
        pieceMeter: normalizePieceMeterOption(parsed.piece_meter || '1'),
        barcode: String(parsed.barcode || '').trim(),
        itemId: String(parsed.item_id || '').trim(),
      });
      clearPurchaseBill();
      setRows([mappedRow]);
      setActiveTab(0);
      toast.success('Item prefilled in new purchase bill');
    } catch (error) {
      toast.error('Failed to prefill item in purchase bill');
    }
  }, [clearPurchaseBill, location.search]);

  const generatePurchasePdf = (order) => {
    alert(`PDF generation for Purchase Order ${order.purchase_no || ''} - Feature coming soon!`);
  };

  const retrieveReturnOrder = async () => {
    const targetNo = String(returnForm.purchaseNo || '').trim().toUpperCase();
    if (!targetNo) {
      setReturnForm((prev) => ({ ...prev, error: 'Enter purchase number' }));
      return;
    }

    const exactInMemory = purchaseOrders.find(
      (order) => String(order.purchase_no || '').trim().toUpperCase() === targetNo
    );
    let matched = exactInMemory;

    if (!matched) {
      try {
        const response = await purchaseAPI.getOrders({ limit: 50, search: targetNo });
        const rows = Array.isArray(response?.data?.orders) ? response.data.orders : [];
        matched = rows.find((order) => String(order.purchase_no || '').trim().toUpperCase() === targetNo) || null;
      } catch (error) {
        setReturnForm((prev) => ({ ...prev, error: error?.message || 'Failed to retrieve purchase bill' }));
        return;
      }
    }

    if (!matched) {
      setReturnForm((prev) => ({ ...prev, original: null, error: 'Purchase bill not found' }));
      return;
    }

    const purchaseType = String(matched.purchase_type || 'PURCHASE').toUpperCase();
    if (purchaseType === 'PURCHASE_RETURN') {
      setReturnForm((prev) => ({
        ...prev,
        original: null,
        error: 'Select original purchase bill. Return bills cannot be returned again.',
      }));
      return;
    }

    setReturnForm((prev) => ({
      ...prev,
      purchaseNo: matched.purchase_no || prev.purchaseNo,
      original: matched,
      error: '',
    }));
  };

  const submitPurchaseReturn = async () => {
    const original = returnForm.original;
    if (!original) {
      setReturnForm((prev) => ({ ...prev, error: 'Retrieve purchase bill first' }));
      return;
    }

    const totalQty = getOrderTotalQty(original);
    if (totalQty <= 0) {
      setReturnForm((prev) => ({ ...prev, error: 'Selected bill has no returnable quantity' }));
      return;
    }

    const qty = Math.max(0, toNumber(returnForm.returnQty));
    if (qty <= 0) {
      setReturnForm((prev) => ({ ...prev, error: 'Enter return quantity' }));
      return;
    }
    if (qty > totalQty) {
      setReturnForm((prev) => ({ ...prev, error: `Return quantity cannot exceed ${toFixed2(totalQty)}` }));
      return;
    }

    const id = getOrderId(original);
    if (!id) {
      setReturnForm((prev) => ({ ...prev, error: 'Invalid purchase bill id' }));
      return;
    }

    createReturnMutation.mutate({
      id,
      payload: {
        return_qty: Number(toFixed2(qty)),
        reason: String(returnForm.reason || 'Return').trim(),
      },
    });
  };

  const focusCell = useCallback((rowIndex, colIndex) => {
    const key = `${rowIndex}-${colIndex}`;
    const element = inputRefs.current[key];
    if (element) {
      element.focus();
      if (typeof element.select === 'function') {
        element.select();
      }
    }
  }, []);

  const updateRowCell = useCallback((rowIndex, field, value, sourceField = field) => {
    setRows((prev) => {
      const next = [...prev];
      const current = { ...next[rowIndex], [field]: value };
      next[rowIndex] = recalculateRow(current, sourceField);

      // Auto-add new row if modifying the last row and it has basic code/qty
      if (rowIndex === prev.length - 1) {
        const updatedRow = next[rowIndex];
        if (
          String(updatedRow.code || '').trim() &&
          toNumber(updatedRow.qty) > 0 &&
          toNumber(updatedRow.cost) > 0
        ) {
          next.push(createEmptyRow());
        }
      }

      return next;
    });
  }, []);

  const removeRow = useCallback((rowIndex) => {
    setRows((prev) => {
      const next = prev.filter((_, index) => index !== rowIndex);
      if (next.length === 0) {
        return [createEmptyRow()];
      }
      return next;
    });
  }, []);

  const onSupplierChange = (supplierId) => {
    const matched = suppliers.find((s) => String(s.supplier_id || s.id) === String(supplierId));
    setPurchaseForm((prev) => ({
      ...prev,
      supplier_id: supplierId,
      supplier_code: matched?.supplier_code || '',
      supplier_name: matched?.supplier_name || '',
    }));
  };

  const findItemByCode = async (rawCode) => {
    const code = String(rawCode || '').trim();
    if (!code) return null;

    try {
      const byBarcode = await itemsAPI.getItemByBarcode(code);
      return byBarcode?.data || null;
    } catch (error) {
      // fallback search
    }

    const searchResponse = await itemsAPI.searchItems(code);
    const list = Array.isArray(searchResponse?.data) ? searchResponse.data : [];
    const normalizedCode = code.toUpperCase();

    const exact =
      list.find((item) => String(item.item_code || '').toUpperCase() === normalizedCode) ||
      list.find((item) => String(item.barcode || '').toUpperCase() === normalizedCode);

    return exact || list[0] || null;
  };

  const lookupCodeForRow = useCallback(
    async (rowIndex, explicitCode = '') => {
      const sourceCode = String(explicitCode || rows[rowIndex]?.code || '').trim();
      if (!sourceCode) return;

      try {
        const normalizedSourceCode = sourceCode.toUpperCase();
        const latestPurchaseContext =
          latestPurchaseContextByCode.get(normalizedSourceCode) || null;
        const item = await findItemByCode(sourceCode);
        if (!item) {
          setRows((prev) => {
            const next = [...prev];
            const current = { ...next[rowIndex] };
            current.barcode = current.barcode || sourceCode;
            next[rowIndex] = recalculateRow(current, 'code');
            return next;
          });
          toast(`New barcode "${sourceCode}" will be created in Items when bill is saved.`);
          return;
        }

        setRows((prev) => {
          const next = [...prev];
          const current = { ...next[rowIndex] };
          const historyRow = latestPurchaseContext?.line
            ? mapPurchaseItemToRow(latestPurchaseContext.line)
            : null;
          const qty = toNumber(current.qty);
          const itemPieceMeter = normalizePieceMeterOption(
            String(item.item_type || '').toUpperCase() === 'PRODUCT'
              ? '1'
              : item.piece_meter ?? item.pieceMeter ?? item.unit_name ?? current.pieceMeter
          );
          const itemCostPerQty = historyRow
            ? toNumber(historyRow.costPerQty)
            : toNumber(item.cost_per_qty ?? item.costPerQty ?? item.purchase_price ?? item.net_cost ?? item.cost);
          const itemCost = historyRow
            ? toNumber(historyRow.cost)
            : toNumber(item.cost ?? (itemCostPerQty > 0 ? itemCostPerQty * qty : 0));
          const itemDiscountPercent = historyRow
            ? toNumber(historyRow.discountPercent)
            : toNumber(item.discount_percent ?? item.discountPercent);
          const itemDiscountAmount = historyRow
            ? toNumber(historyRow.discountAmount)
            : toNumber(item.discount_amount ?? item.discountAmount);
          const itemTaxPercent = historyRow
            ? toNumber(historyRow.taxPercent)
            : toNumber(item.tax_percentage ?? item.tax ?? item.taxPercent);
          const itemTaxAmount = historyRow
            ? toNumber(historyRow.taxAmount)
            : toNumber(item.tax_amount ?? item.taxAmount);
          const itemNetCost = historyRow
            ? toNumber(historyRow.netCost)
            : toNumber(item.net_cost ?? item.netCost);
          const itemRoi = historyRow
            ? toNumber(historyRow.roiPercent)
            : toNumber(item.roi_percent ?? item.roiPercent);
          const itemGross = historyRow
            ? toNumber(historyRow.grossProfitPercent)
            : toNumber(item.gross_profit_percent ?? item.grossProfitPercent);
          const itemSellingPrice = historyRow
            ? toNumber(historyRow.sellingPrice)
            : toNumber(item.selling_price ?? item.sale_price ?? item.sellingPrice);
          const itemSellingPricePerPiece = historyRow
            ? toNumber(historyRow.sellingPricePerPiece)
            : toNumber(item.selling_price_per_piece ?? item.sellingPricePerPiece);
          const itemNetAmount = historyRow
            ? toNumber(historyRow.netAmount)
            : toNumber(item.net_amount ?? item.netAmount);

          current.code = item.item_code || item.barcode || sourceCode;
          current.color = historyRow ? String(historyRow.color || '').trim() : String(item.color || current.color || '').trim();
          current.hsnCode = historyRow ? String(historyRow.hsnCode || '').trim() : String(item.hsn_code || '').trim();
          current.description = historyRow ? String(historyRow.description || '').trim() : (item.item_name || current.description || '');
          current.pieceMeter = historyRow ? normalizePieceMeterOption(historyRow.pieceMeter) : itemPieceMeter;
          current.costInputMode = 'costPerQty';
          current.costPerQty = toCompact2(itemCostPerQty);
          current.cost = toCompact2(itemCost);
          current.discountPercent = toCompact2(itemDiscountPercent);
          current.discountAmount = toCompact2(itemDiscountAmount);
          current.taxPercent = toCompact2(itemTaxPercent);
          current.taxAmount = toCompact2(itemTaxAmount);
          current.netCost = toCompact2(itemNetCost);
          current.roiPercent = toCompact2(itemRoi);
          current.grossProfitPercent = toCompact2(itemGross);
          current.sellingPrice = toCompact2(itemSellingPrice);
          current.sellingPricePerPiece = toCompact2(itemSellingPricePerPiece);
          current.netAmount = toCompact2(itemNetAmount);
          current.itemId = item.item_id || item.id || '';
          current.barcode = item.barcode || sourceCode;
          current.itemType = String(item.item_type || 'FABRIC').toUpperCase();
          current.customProductName = String(item.custom_product_name || '').trim();
          if (historyRow && toNumber(current.qty) <= 0) {
            current.qty = toCompact2(historyRow.qty);
          }
          next[rowIndex] = recalculateRow(current, 'costPerQty');
          return next;
        });

        if (
          latestPurchaseContext?.order &&
          !String(purchaseForm.supplier_id || '').trim()
        ) {
          const order = latestPurchaseContext.order;
          setPurchaseForm((prev) => ({
            ...prev,
            supplier_id: String(order.supplier_id || prev.supplier_id || '').trim(),
            supplier_code: String(order.supplier_code || prev.supplier_code || '').trim(),
            supplier_name: String(order.supplier_name || prev.supplier_name || '').trim(),
          }));
        }
      } catch (error) {
        toast.error(error?.message || 'Failed to fetch item');
      }
    },
    [latestPurchaseContextByCode, mapPurchaseItemToRow, purchaseForm.supplier_id, rows]
  );

  const createPurchase = useCallback(
    (hold = false, options = {}) => {
      const { nextTabOnSuccess = null } = options;
      const sanitizedRows = rows
        .filter((row) => !isRowCompletelyEmpty(row))
        .map((row) => recalculateRow(row));
      const hasAnyDraftDetail =
        sanitizedRows.length > 0 ||
        Boolean(String(purchaseForm.supplier_id || '').trim()) ||
        Boolean(String(purchaseForm.supplier_name || '').trim()) ||
        Boolean(String(purchaseForm.supplier_code || '').trim()) ||
        Boolean(String(purchaseForm.invoice_number || '').trim()) ||
        Boolean(String(purchaseForm.paid_amount || '').trim()) ||
        Boolean(String(purchaseForm.narration || '').trim());

      if (!hold && (!purchaseForm.supplier_id || !purchaseForm.supplier_name)) {
        toast.error('Supplier is required');
        return;
      }

      if (!hold && sanitizedRows.length === 0) {
        toast.error('Add at least one purchase row');
        return;
      }

      if (hold && !hasAnyDraftDetail) {
        toast.error('Enter at least one detail before holding bill');
        return;
      }

      const invalidIndex = sanitizedRows.findIndex(
        (row) =>
          !String(row.code || '').trim() ||
          !String(row.description || '').trim() ||
          toNumber(row.qty) <= 0 ||
          toNumber(row.cost) <= 0
      );

      if (!hold && invalidIndex >= 0) {
        toast.error(`Row ${invalidIndex + 1}: code, description, qty and cost are required`);
        return;
      }

      const grandTotal = sanitizedRows.reduce((sum, row) => sum + toNumber(row.netAmount), 0);
      if (!hold && grandTotal <= 0) {
        toast.error('Grand net amount must be greater than 0');
        return;
      }

      const paidAmount = purchaseForm.paid_amount === '' ? 0 : Math.max(0, Number(purchaseForm.paid_amount || 0));
      if (!hold && paidAmount > grandTotal) {
        toast.error('Paid amount cannot exceed grand total');
        return;
      }

      const payload = {
        supplier_id: purchaseForm.supplier_id,
        supplier_code: purchaseForm.supplier_code,
        supplier_name: purchaseForm.supplier_name,
        invoice_number: String(purchaseForm.invoice_number || '').trim(),
        purchase_date: purchaseForm.purchase_date,
        grand_total: Number(grandTotal.toFixed(2)),
        payment_mode: purchaseForm.payment_mode,
        paid_amount:
          purchaseForm.paid_amount === '' ? undefined : Math.max(0, Number(purchaseForm.paid_amount || 0)),
        narration: String(purchaseForm.narration || '').trim(),
        status: hold ? 'HOLD' : 'ACTIVE',
        items: sanitizedRows.map((row) => {
          const pieceMeterOption = normalizePieceMeterOption(row.pieceMeter);
          const pieceMeterFactor = getPieceMeterFactor(pieceMeterOption);
          const sellingPrice = Number(toFixed2(row.sellingPrice));
          const taxPercent = Number(toFixed2(row.taxPercent));
          const mrp = Number(toFixed2(sellingPrice * (1 + taxPercent / 100)));

          return {
            itemId: row.itemId || '',
            item_type: row.itemType || 'FABRIC',
            custom_product_name: String(row.customProductName || '').trim(),
            barcode: String(row.barcode || row.code || '').trim(),
            itemName: String(row.description || '').trim(),
            qty: Number(toFixed2(row.qty)),
            rate: Number(toFixed2(row.netCost)),
            amount: Number(toFixed2(row.netAmount)),
            code: String(row.code || '').trim(),
            color: String(row.color || '').trim(),
            hsn_code: String(row.hsnCode || '').trim(),
            description: String(row.description || '').trim(),
            shrinkage: Number(toFixed2(row.shrinkage)),
            available_qty: Number(toFixed2(row.availableQty)),
            qty_meter: Number(toFixed2(row.qty)),
            unit_type: pieceMeterOption === 'ROLL' ? 'roll' : 'meter',
            piece_meter: Number(toFixed2(pieceMeterFactor)),
            roll_qty: 0,
            cost: Number(toFixed2(row.cost)),
            cost_per_qty: Number(toFixed2(row.costPerQty)),
            mrp: mrp,
            tax_percent: taxPercent,
            tax_amount: Number(toFixed2(row.taxAmount)),
            discount_percent: Number(toFixed2(row.discountPercent)),
            discount_amount: Number(toFixed2(row.discountAmount)),
            net_cost: Number(toFixed2(row.netCost)),
            roi_percent: Number(toFixed2(row.roiPercent)),
            gross_profit_percent: Number(toFixed2(row.grossProfitPercent)),
            selling_price: sellingPrice,
            selling_price_per_piece: Number(toFixed2(row.sellingPricePerPiece)),
            net_amount: Number(toFixed2(row.netAmount)),
          };
        }),
      };

      const mutationOptions =
        nextTabOnSuccess === null
          ? undefined
          : {
            onSuccess: () => {
              setActiveTab(nextTabOnSuccess);
            },
          };

      if (editingHoldId) {
        updateOrderMutation.mutate({ id: editingHoldId, payload }, mutationOptions);
      } else {
        createOrderMutation.mutate(payload, mutationOptions);
      }
    },
    [createOrderMutation, editingHoldId, purchaseForm, rows, updateOrderMutation]
  );

  const savePurchaseBill = useCallback(() => {
    createPurchase(false);
  }, [createPurchase]);

  const holdPurchaseBill = useCallback(
    (nextTabOnSuccess = null) => {
      createPurchase(true, { nextTabOnSuccess });
    },
    [createPurchase]
  );

  const isSavingPurchase = createOrderMutation.isLoading || updateOrderMutation.isLoading;

  const handleMainTabChange = useCallback(
    (_event, value) => {
      // Moving to Hold tab with draft data should push current bill to HOLD first.
      if (value === 2 && activeTab === 0 && hasDraftPurchase) {
        holdPurchaseBill(2);
        return;
      }
      setActiveTab(value);
    },
    [activeTab, hasDraftPurchase, holdPurchaseBill]
  );



  const submitSupplierPayment = () => {
    const amount = Math.max(0, Number(paymentForm.amount || 0));
    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    paySupplierMutation.mutate({
      id: payDialog.rowId,
      payload: {
        amount,
        mode: paymentForm.mode,
        note: String(paymentForm.note || '').trim(),
      },
    });
  };

  const createSupplier = () => {
    const payload = {
      supplier_code: String(supplierForm.supplier_code || '').trim().toUpperCase(),
      supplier_name: String(supplierForm.supplier_name || '').trim(),
      mobile: String(supplierForm.mobile || '').trim(),
      email: String(supplierForm.email || '').trim(),
      address: String(supplierForm.address || '').trim(),
      gst_no: String(supplierForm.gst_no || '').trim(),
      supplying_fabric: String(supplierForm.supplying_fabric || '').trim(),
      supply_quantity: Math.max(0, Number(supplierForm.supply_quantity || 0)),
      is_active: true,
    };

    if (!payload.supplier_code || !payload.supplier_name) {
      toast.error('Supplier ID and Supplier Name are required');
      return;
    }

    createSupplierMutation.mutate(payload);
  };

  const handleGridKeyDown = (event, rowIndex, colIndex) => {
    const key = event.key;
    const isNavigationKey = ['Enter', 'Tab', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key);
    if (!isNavigationKey) return;

    const activeColumn = visibleColumns[colIndex];
    if (
      activeColumn?.key === 'code' &&
      ['Enter', 'Tab', 'ArrowRight', 'ArrowDown'].includes(key)
    ) {
      lookupCodeForRow(rowIndex, event.currentTarget?.value || '');
    }

    event.preventDefault();

    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (key === 'Enter' || key === 'ArrowRight' || (key === 'Tab' && !event.shiftKey)) {
      targetCol += 1;
    } else if (key === 'ArrowLeft' || (key === 'Tab' && event.shiftKey)) {
      targetCol -= 1;
    } else if (key === 'ArrowDown') {
      targetRow += 1;
    } else if (key === 'ArrowUp') {
      targetRow -= 1;
    }

    if (targetCol >= visibleColumns.length) {
      targetCol = 0;
      targetRow += 1;
    }

    if (targetCol < 0) {
      targetCol = visibleColumns.length - 1;
      targetRow -= 1;
    }

    if (targetRow < 0) {
      targetRow = 0;
    }

    if (targetRow >= rows.length) {
      targetRow = rows.length - 1;
    }

    setTimeout(() => focusCell(targetRow, targetCol), 0);
  };

  useEffect(() => {
    const listener = (event) => {
      if (activeTab !== 0) return;
      if (event.key === 'F9') {
        event.preventDefault();
        savePurchaseBill();
      } else if (event.key === 'F10') {
        event.preventDefault();
        holdPurchaseBill();
      } else if (event.key === 'F12') {
        event.preventDefault();
        clearPurchaseBill();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [activeTab, clearPurchaseBill, holdPurchaseBill, savePurchaseBill]);

  return (
    <Box sx={{ p: 0.5, bgcolor: '#f8fafc', height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>
        {`
          .purchase-grid-table {
            table-layout: fixed;
            border-collapse: collapse;
            width: 100%;
            background: white;
          }
          .purchase-grid-input {
            width: 100%;
            height: 24px;
            border: none;
            outline: none;
            background: transparent;
            font-size: 11px;
            padding: 2px 4px;
          }
          .purchase-grid-input:focus {
            background: #fff7ed;
            border: 1px solid #fb923c;
          }
          .purchase-row td {
            height: 26px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid rgba(229, 231, 235, 0.5);
            padding: 0;
            overflow: hidden;
          }
          .purchase-row:hover td {
            background-color: #f8fafc;
          }
          .purchase-row.active td {
            background-color: #fff7ed;
          }
          .purchase-header-cell {
            background: #f97316;
            color: white;
            font-size: 10.5px;
            font-weight: 600;
            height: 28px;
            border: 1px solid #e5e7eb;
            padding: 2px 4px;
            text-align: left;
            line-height: 1.1;
            white-space: wrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .purchase-empty-row td {
            height: 26px;
            border-bottom: 1px solid #e5e7eb;
            border-right: 1px solid rgba(229, 231, 235, 0.5);
            background-color: #fafafa;
          }
        `}
      </style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, px: 1 }}>
        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
          <ShoppingCart sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: '1.2rem' }} />
          Purchase
        </Typography>
        <Button size="small" variant="outlined" startIcon={<PersonAdd />} onClick={() => setOpenSupplierCreate(true)} sx={{ py: 0.3, fontSize: '0.75rem' }}>
          New Supplier
        </Button>
      </Box>

      <Grid container spacing={0.5} sx={{ mb: 0.5, px: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 0.8, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Today Purchase</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{money(stats.todaysPurchases)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 0.8, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Supplier Due</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{money(stats.supplierDue)}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 0.8, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Total Purchase Bills</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{stats.totalPurchaseBills}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 0.8, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>This Month Purchase</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>{money(stats.thisMonthPurchases)}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ mb: 0.5, mx: 1 }} elevation={0}>
        <Tabs value={activeTab} onChange={handleMainTabChange} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: '0.8rem' } }}>
          <Tab label="Purchase Bill" />
          <Tab label="Purchase History" />
          <Tab label="Purchase Hold" />
          <Tab label="Purchase Return" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Paper sx={{ p: 1, mx: 1, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} elevation={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Purchase Bill
            </Typography>
            {editingHoldId && (
              <Chip
                size="small"
                color="warning"
                sx={{ height: 20, fontSize: '0.7rem' }}
                label={`Editing: ${editingHoldNo || editingHoldId}`}
              />
            )}
          </Box>

          <Grid container spacing={0.8} sx={{ mb: 0.5 }}>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8rem' }}>Supplier *</InputLabel>
                <Select
                  value={purchaseForm.supplier_id}
                  label="Supplier *"
                  onChange={(e) => onSupplierChange(e.target.value)}
                  sx={{ fontSize: '0.8rem' }}
                >
                  <MenuItem value="" sx={{ fontSize: '0.8rem' }}>Select Supplier</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.supplier_id || supplier.id} value={supplier.supplier_id || supplier.id} sx={{ fontSize: '0.8rem' }}>
                      {supplier.supplier_name} ({supplier.supplier_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Code"
                value={purchaseForm.supplier_code}
                InputProps={{ readOnly: true, sx: { fontSize: '0.8rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Date"
                value={purchaseForm.purchase_date}
                onChange={(e) => setPurchaseForm((prev) => ({ ...prev, purchase_date: e.target.value }))}
                InputLabelProps={{ shrink: true, sx: { fontSize: '0.8rem' } }}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Invoice No"
                value={purchaseForm.invoice_number}
                onChange={(e) => setPurchaseForm((prev) => ({ ...prev, invoice_number: e.target.value }))}
                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8rem' }}>Payment</InputLabel>
                <Select
                  value={purchaseForm.payment_mode}
                  label="Payment"
                  onChange={(e) => setPurchaseForm((prev) => ({ ...prev, payment_mode: e.target.value }))}
                  sx={{ fontSize: '0.8rem' }}
                >
                  {PAYMENT_OPTIONS.map((mode) => (
                    <MenuItem key={mode} value={mode} sx={{ fontSize: '0.8rem' }}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Paid Amt"
                value={purchaseForm.paid_amount}
                onChange={(e) => setPurchaseForm((prev) => ({ ...prev, paid_amount: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }}
                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
            </Grid>
            <Grid item xs={12} md={1.5}>
              <TextField
                fullWidth
                size="small"
                label="Narration"
                value={purchaseForm.narration}
                onChange={(e) => setPurchaseForm((prev) => ({ ...prev, narration: e.target.value }))}
                InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
                InputProps={{ sx: { fontSize: '0.8rem' } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', mt: 0.5 }}>
            <Box sx={{ mb: 0.3, display: 'flex', justifyContent: 'flex-start' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowExtraColumns(!showExtraColumns)}
                sx={{ py: 0.2, fontSize: '0.7rem', minHeight: 24 }}
              >
                {showExtraColumns ? 'Hide' : 'Show'} HSN & Gross Profit
              </Button>
            </Box>
            <Box sx={{ border: '1px solid #e5e7eb', background: 'white', padding: 0, flex: 1, overflowX: 'hidden', overflowY: 'auto' }}>
              <table className="purchase-grid-table">
                <colgroup>
                  <col style={{ width: '2%' }} />    {/* S.No */}
                  <col style={{ width: '6%' }} />    {/* Code */}
                  <col style={{ width: '12%' }} />   {/* Desc */}
                  <col style={{ width: '6%' }} />    {/* Color */}
                  <col style={{ width: '4%' }} />    {/* Qty */}
                  <col style={{ width: '4%' }} />    {/* Shrinkage */}
                  <col style={{ width: '4%' }} />    {/* Available Qty */}
                  <col style={{ width: '4%' }} />    {/* Piece/Meter */}
                  <col style={{ width: '4%' }} />    {/* Cost/Qty */}
                  <col style={{ width: '4%' }} />    {/* Cost */}
                  <col style={{ width: '3%' }} />    {/* Disc % */}
                  <col style={{ width: '4%' }} />    {/* Disc Amount */}
                  <col style={{ width: '3%' }} />    {/* Tax % */}
                  <col style={{ width: '4%' }} />    {/* Tax Amount */}
                  <col style={{ width: '5%' }} />    {/* Net Cost */}
                  <col style={{ width: '3%' }} />    {/* ROI % */}
                  <col style={{ width: '5%' }} />    {/* Selling Price */}
                  <col style={{ width: '5%' }} />    {/* Selling Price/Piece */}
                  <col style={{ width: '6%' }} />    {/* Net Amount */}
                  {showExtraColumns && <col style={{ width: '4%' }} />}
                  {showExtraColumns && <col style={{ width: '4%' }} />}
                  <col style={{ width: '3%' }} />    {/* Action */}
                </colgroup>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th className="purchase-header-cell">S.No</th>
                    {visibleColumns.map((column) => (
                      <th key={column.key} className="purchase-header-cell">
                        {column.label}
                      </th>
                    ))}
                    <th className="purchase-header-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={`purchase-row-${rowIndex}`} className={`purchase-row ${activeRow === rowIndex ? 'active' : ''}`}>
                      <td style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, padding: '2px' }}>
                        {rowIndex + 1}
                      </td>
                      {visibleColumns.map((column, colIndex) => {
                        const refKey = `${rowIndex}-${colIndex}`;
                        const commonProps = {
                          ref: (element) => {
                            inputRefs.current[refKey] = element;
                          },
                          onKeyDown: (event) => handleGridKeyDown(event, rowIndex, colIndex),
                          className: 'purchase-grid-input',
                          onFocus: () => setActiveRow(rowIndex),
                        };

                        const isReadOnly = Boolean(column.readOnly);
                        const cellValue = row[column.key] ?? '';
                        const isPieceMeterSelect = column.key === 'pieceMeter';
                        const inputType = column.type === 'number' ? 'number' : 'text';
                        const displayValue =
                          isPieceMeterSelect
                            ? normalizePieceMeterOption(cellValue)
                            : column.type === 'number' && cellValue !== '' && toNumber(cellValue) === 0
                              ? ''
                              : cellValue;

                        return (
                          <td key={column.key} style={{ padding: 0 }}>
                            {isPieceMeterSelect ? (
                              <select
                                {...commonProps}
                                value={displayValue}
                                disabled={isReadOnly}
                                onChange={(event) => {
                                  updateRowCell(rowIndex, column.key, event.target.value, column.key);
                                }}
                              >
                                {PIECE_METER_OPTIONS.map((option) => (
                                  <option key={option} value={option}>
                                    {option === 'ROLL' ? 'Piece' : option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                {...commonProps}
                                type={inputType}
                                min={inputType === 'number' ? '0' : undefined}
                                step={inputType === 'number' ? '0.01' : undefined}
                                value={displayValue}
                                readOnly={isReadOnly}
                                onChange={(event) => {
                                  updateRowCell(rowIndex, column.key, event.target.value, column.key);
                                }}
                                onBlur={(event) => {
                                  if (column.key === 'code') {
                                    lookupCodeForRow(rowIndex, event.target.value);
                                  }
                                }}
                              />
                            )}
                          </td>
                        );
                      })}

                      <td style={{ padding: 0, textAlign: 'center' }}>
                        <button
                          type="button"
                          style={{
                            width: '100%',
                            height: '26px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#dc2626',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#fee2e2'}
                          onMouseOut={(e) => e.target.style.background = 'transparent'}
                          onClick={() => removeRow(rowIndex)}
                        >
                          Del
                        </button>
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="purchase-empty-row">
                      <td />
                      {visibleColumns.map((col) => (
                        <td key={`empty-${idx}-${col.key}`} />
                      ))}
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>

          <Box sx={{ borderTop: '2px solid #e5e7eb', pt: 1, mt: 0.5, flexShrink: 0 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs>
                <Grid container spacing={1.5}>
                  <Grid item>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Total Qty</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{toFixed2(totals.totalQty)}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Total Discount</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{money(totals.totalDiscount)}</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>Total Tax</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{money(totals.totalTax)}</Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs="auto" sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mb: 0.2 }}>Net Amount</Typography>
                <Box
                  sx={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#ea580c',
                    backgroundColor: '#fff7ed',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    minWidth: '150px',
                    textAlign: 'right',
                  }}
                >
                  {money(totals.grandNet)}
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 0.5, flexShrink: 0 }}>
            <Paper
              square
              elevation={2}
              sx={{
                bgcolor: '#212121',
                color: '#fff',
                p: 0.8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={clearPurchaseBill}
                  startIcon={<RestartAlt sx={{ fontSize: '1rem' }} />}
                  sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' }, px: 1.5, py: 0.5, fontSize: '0.8rem', minHeight: 32 }}
                >
                  CLEAR (F12)
                </Button>
                <Button
                  variant="contained"
                  onClick={() => holdPurchaseBill()}
                  startIcon={<Pause sx={{ fontSize: '1rem' }} />}
                  disabled={isSavingPurchase}
                  sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' }, px: 2, py: 0.5, fontSize: '0.8rem', minHeight: 32 }}
                >
                  HOLD (F10)
                </Button>
                <Button
                  variant="contained"
                  onClick={savePurchaseBill}
                  startIcon={<Save sx={{ fontSize: '1rem' }} />}
                  disabled={isSavingPurchase}
                  sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, px: 2.5, py: 0.5, fontSize: '0.85rem', minHeight: 32 }}
                >
                  {editingHoldId ? 'UPDATE' : 'SAVE'} (F9)
                </Button>
              </Box>
            </Paper>
          </Box>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Purchase History
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.fromDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.toDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={filters.supplierId}
                  label="Supplier"
                  onChange={(e) => setFilters((prev) => ({ ...prev, supplierId: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem
                      key={supplier.supplier_id || supplier.id}
                      value={supplier.supplier_id || supplier.id}
                    >
                      {supplier.supplier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Payment"
                  onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>PO #</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Supplier</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Invoice</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Reference</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Total</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Paid</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Due</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Payment Status</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      No purchase bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((row) => (
                    <TableRow key={row.purchase_id || row.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={String(row.purchase_type || 'PURCHASE').toUpperCase() === 'PURCHASE_RETURN' ? 'RETURN' : 'PURCHASE'}
                          color={String(row.purchase_type || 'PURCHASE').toUpperCase() === 'PURCHASE_RETURN' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{row.purchase_no || '-'}</TableCell>
                      <TableCell>{safeDate(row.purchase_date)}</TableCell>
                      <TableCell>{row.supplier_name || '-'}</TableCell>
                      <TableCell>{row.invoice_number || '-'}</TableCell>
                      <TableCell>{row.reference_purchase_no || '-'}</TableCell>
                      <TableCell align="right">{money(row.grand_total)}</TableCell>
                      <TableCell align="right">{money(row.paid_amount)}</TableCell>
                      <TableCell align="right">{money(row.due_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.payment_status || 'PENDING'}
                          color={row.payment_status === 'PAID' ? 'success' : row.payment_status === 'PARTIAL' ? 'warning' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" title="Edit" onClick={() => editPurchaseBill(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" title="Print PDF" onClick={() => generatePurchasePdf(row)}>
                          <Print fontSize="small" />
                        </IconButton>
                        <IconButton size="small" title="Download PDF" onClick={() => generatePurchasePdf(row)}>
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          title="View Details"
                          onClick={() =>
                            alert(
                              `Purchase No: ${row.purchase_no}\nSupplier: ${row.supplier_name}\nDate: ${safeDate(row.purchase_date)}\nTotal: ${money(row.grand_total)}\nPaid: ${money(row.paid_amount)}\nDue: ${money(row.due_amount)}`
                            )
                          }
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {String(row.purchase_type || 'PURCHASE').toUpperCase() === 'PURCHASE_RETURN' &&
                          String(row.payment_status || '').toUpperCase() === 'REFUND_PENDING' && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                const confirmed = window.confirm(`Complete refund for ${row.purchase_no}?`);
                                if (confirmed) {
                                  toast.success('Refund completed successfully');
                                  queryClient.invalidateQueries('purchase-orders');
                                }
                              }}
                              sx={{ ml: 1, bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                            >
                              Complete Refund
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Purchase Hold
          </Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} /> }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                value={filters.fromDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                value={filters.toDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Supplier</InputLabel>
                <Select
                  value={filters.supplierId}
                  label="Supplier"
                  onChange={(e) => setFilters((prev) => ({ ...prev, supplierId: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem
                      key={supplier.supplier_id || supplier.id}
                      value={supplier.supplier_id || supplier.id}
                    >
                      {supplier.supplier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment</InputLabel>
                <Select
                  value={filters.paymentStatus}
                  label="Payment"
                  onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PARTIAL">Partial</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>PO #</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Supplier</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Invoice</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Total</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Paid</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="right">Due</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }}>Payment</TableCell>
                  <TableCell sx={{ bgcolor: '#ff9800', color: '#fff', fontWeight: 'bold' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {holdOrdersLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : holdOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No hold bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  holdOrders.map((row) => (
                    <TableRow key={row.purchase_id || row.id} hover>
                      <TableCell>{row.purchase_no || '-'}</TableCell>
                      <TableCell>{safeDate(row.purchase_date)}</TableCell>
                      <TableCell>{row.supplier_name || '-'}</TableCell>
                      <TableCell>{row.invoice_number || '-'}</TableCell>
                      <TableCell align="right">{money(row.grand_total)}</TableCell>
                      <TableCell align="right">{money(row.paid_amount)}</TableCell>
                      <TableCell align="right">{money(row.due_amount)}</TableCell>
                      <TableCell>
                        <Chip size="small" color="warning" label={row.payment_status || 'PENDING'} />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button size="small" variant="contained" onClick={() => resumeHoldBill(row)}>
                            Open Bill
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => deleteHoldBill(row)}
                            disabled={deleteHoldOrderMutation.isLoading}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 3 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Return
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Purchase No *"
                value={returnForm.purchaseNo}
                onChange={(event) =>
                  setReturnForm((prev) => ({
                    ...prev,
                    purchaseNo: event.target.value.toUpperCase(),
                    error: '',
                    original:
                      prev.original &&
                        String(prev.original.purchase_no || '').toUpperCase() ===
                        String(event.target.value || '').toUpperCase()
                        ? prev.original
                        : null,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" fullWidth sx={{ height: '100%' }} onClick={retrieveReturnOrder}>
                Retrieve
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Return Qty (Meter) *"
                value={returnForm.returnQty}
                onChange={(event) =>
                  setReturnForm((prev) => ({ ...prev, returnQty: event.target.value, error: '' }))
                }
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reason"
                value={returnForm.reason}
                onChange={(event) =>
                  setReturnForm((prev) => ({ ...prev, reason: event.target.value, error: '' }))
                }
              />
            </Grid>
          </Grid>

          {returnForm.original && (
            <Paper variant="outlined" sx={{ mt: 2, p: 1.5 }}>
              <Typography variant="body2">
                <b>Supplier:</b> {returnForm.original.supplier_name || '-'}
              </Typography>
              <Typography variant="body2">
                <b>Date:</b> {safeDate(returnForm.original.purchase_date)}
              </Typography>
              <Typography variant="body2">
                <b>Available Qty:</b> {toFixed2(getOrderTotalQty(returnForm.original))}
              </Typography>
              <Typography variant="body2">
                <b>Bill Amount:</b> {money(returnForm.original.grand_total)}
              </Typography>
            </Paper>
          )}

          {returnForm.error && (
            <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
              {returnForm.error}
            </Typography>
          )}

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => setReturnForm(emptyReturnForm)}>
              Clear
            </Button>
            <Button variant="contained" onClick={submitPurchaseReturn} disabled={createReturnMutation.isLoading}>
              Process Return
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={openSupplierCreate} onClose={() => setOpenSupplierCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Supplier</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier ID *"
                value={supplierForm.supplier_code}
                onChange={(event) =>
                  setSupplierForm((prev) => ({ ...prev, supplier_code: event.target.value.toUpperCase() }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name *"
                value={supplierForm.supplier_name}
                onChange={(event) => setSupplierForm((prev) => ({ ...prev, supplier_name: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={supplierForm.mobile}
                onChange={(event) => setSupplierForm((prev) => ({ ...prev, mobile: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={supplierForm.email}
                onChange={(event) => setSupplierForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={supplierForm.address}
                onChange={(event) => setSupplierForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplying Fabric"
                value={supplierForm.supplying_fabric}
                onChange={(event) =>
                  setSupplierForm((prev) => ({ ...prev, supplying_fabric: event.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Supply Quantity"
                value={supplierForm.supply_quantity}
                onChange={(event) =>
                  setSupplierForm((prev) => ({ ...prev, supply_quantity: event.target.value }))
                }
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GST No"
                value={supplierForm.gst_no}
                onChange={(event) => setSupplierForm((prev) => ({ ...prev, gst_no: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSupplierCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={createSupplier} disabled={createSupplierMutation.isLoading}>
            Create Supplier
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={payDialog.open}
        onClose={() => setPayDialog({ open: false, rowId: '', title: '' })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{payDialog.title || 'Record Payment'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Amount *"
                value={paymentForm.amount}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Mode</InputLabel>
                <Select
                  value={paymentForm.mode}
                  label="Mode"
                  onChange={(event) => setPaymentForm((prev) => ({ ...prev, mode: event.target.value }))}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="BANK">Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Note"
                value={paymentForm.note}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, note: event.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog({ open: false, rowId: '', title: '' })}>Cancel</Button>
          <Button variant="contained" onClick={submitSupplierPayment} disabled={paySupplierMutation.isLoading}>
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchase;
