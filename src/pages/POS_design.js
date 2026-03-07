import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Chip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete
} from '@mui/material';
import PointOfSale from '@mui/icons-material/PointOfSale';
import Save from '@mui/icons-material/Save';
import Pause from '@mui/icons-material/Pause';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Visibility from '@mui/icons-material/Visibility';
import Print from '@mui/icons-material/Print';
import Download from '@mui/icons-material/Download';
import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { inventoryAPI, salesAPI, customersAPI, itemsAPI, securityAPI, returnsAPI } from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';

const buildInvoiceNo = (date = new Date()) =>
  `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(
    2,
    '0'
  )}${String(date.getSeconds()).padStart(2, '0')}${String(date.getMilliseconds()).padStart(3, '0')}`;

const POS = () => {
  const ORANGE = '#ff9800';
  const GRID_BLUE = '#ff9800';
  const GRID_BORDER = '#efc997';
  const GRID_BG = '#fffaf2';
  const GRID_BG_ALT = '#fff3e2';

  const barcodeInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  const [cart, setCart] = useState([]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [billNoSeed, setBillNoSeed] = useState(() => Date.now());
  const [cashDiscountPercent, setCashDiscountPercent] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [surchargePercent, setSurchargePercent] = useState(0);
  const [freightCharge, setFreightCharge] = useState(0);
  const [packingCharge, setPackingCharge] = useState(0);
  const [otherCharge, setOtherCharge] = useState(0);
  const [extraCharge, setExtraCharge] = useState(0);
  const [albumCharge, setAlbumCharge] = useState(0);
  // Manual overrides for summary values (editable numeric fields)
  const [manualTaxable, setManualTaxable] = useState('');
  const [manualTaxAmount, setManualTaxAmount] = useState('');
  const [manualServiceCharge, setManualServiceCharge] = useState('');
  const [manualRoundOff, setManualRoundOff] = useState('');
  const [manualSurchargeIncl, setManualSurchargeIncl] = useState('');
  const [customerEntry, setCustomerEntry] = useState({
    customerId: '',
    customerName: '',
    mobile: '',
    address: '',
  });
  const [billingError, setBillingError] = useState('');
  const [returnError, setReturnError] = useState('');
  const [catalogItems, setCatalogItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [saleSource, setSaleSource] = useState('MANUAL');
  const [historySource, setHistorySource] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [settings, setSettings] = useState({});
  const [editingHoldId, setEditingHoldId] = useState('');
  const [editingHoldInvoiceNo, setEditingHoldInvoiceNo] = useState('');
  const [isSavingBill, setIsSavingBill] = useState(false);
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnInvoiceNo, setReturnInvoiceNo] = useState('');
  const [returnInvoiceData, setReturnInvoiceData] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [fabricEntry, setFabricEntry] = useState({
    barcode: '',
    item_name: '',
    meters: '1',
    qty: '1',
    rate: '',
    tax: '',
    discountPct: '0',
    servicePct: '0',
  });
  const [barcodeOptions, setBarcodeOptions] = useState([]);
  const [editingLineId, setEditingLineId] = useState(null);
  const [editingRowData, setEditingRowData] = useState({});
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    customer_code: '',
    customer_name: '',
    mobile: '',
    address: '',
  });
  const meterOptions = ['1', '3', '5', '10', 'Roll', 'Others'];

  const refreshSalesHistory = useCallback(async () => {
    try {
      const response = await salesAPI.getBills({ limit: 500 });
      const rows = Array.isArray(response?.data?.items) ? response.data.items : [];
      setSalesHistory(rows);
    } catch (error) {
      setSalesHistory([]);
    }
  }, []);

  useEffect(() => {
    refreshSalesHistory();
    // Load settings
    securityAPI.getSettings().then(res => {
      if (res?.data) setSettings(res.data);
    }).catch(() => { });
  }, [refreshSalesHistory]);

  useEffect(() => {
    const loadItems = async () => {
      setItemsLoading(true);
      try {
        const response = await inventoryAPI.getStock({ fabricOnly: true, limit: 500 });
        const rows = Array.isArray(response?.data?.items) ? response.data.items : [];
        const mapped = rows.map((item) => ({
          id: item.item_id || item.id,
          barcode: item.barcode || item.item_code || '',
          code: item.item_code || '',
          name: item.item_name || '',
          price: Number(item.selling_price ?? item.sale_price ?? 0),
          mrp: Number(item.selling_price ?? item.sale_price ?? 0),
          tax: Number(item.tax_percentage ?? item.tax ?? 0),
          stock: Number(item.current_stock ?? item.stock ?? 0),
          unit: item.unit_name || item.unit || 'MTR',
          fabricType: item.fabric_type || '',
          color: item.color || '',
          widthInch: Number(item.width_inch || 0),
        }));
        setCatalogItems(mapped);
      } catch (error) {
        setCatalogItems([]);
        setBillingError(error?.message || 'Failed to load fabric inventory');
      } finally {
        setItemsLoading(false);
      }
    };
    loadItems();
  }, []);

  const lookupCustomerById = async (rawCustomerId = '') => {
    const customerId = String(rawCustomerId || customerEntry.customerId || '').trim().toUpperCase();
    if (!customerId) return;

    try {
      let exact = null;
      try {
        const direct = await customersAPI.getCustomerByCode(customerId);
        exact = direct?.data || null;
      } catch (error) {
        // Fallback to list search when direct lookup has no match.
      }

      if (!exact) {
        const response = await customersAPI.getCustomers({ q: customerId, limit: 50 });
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
            ? response.data.data
            : [];
        exact = rows.find(
          (c) =>
            String(c.customer_code || '').trim().toUpperCase() === customerId ||
            String(c.customer_id || '').trim().toUpperCase() === customerId
        );
      }

      if (!exact) {
        setCustomerEntry((prev) => ({
          ...prev,
          customerName: '',
          mobile: '',
          address: '',
        }));
        setBillingError(`Customer not found. Click "New Customer" to create.`);
        return;
      }
      setBillingError('');
      setCustomerEntry({
        customerId: String(exact.customer_code || customerId),
        customerName: String(exact.customer_name || ''),
        mobile: String(exact.mobile || ''),
        address: String(exact.address || ''),
      });
      // Auto-focus barcode field after customer lookup
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } catch (error) {
      setBillingError(error?.message || 'Failed to retrieve customer details');
    }
  };

  const createNewCustomer = async () => {
    if (!newCustomerForm.customer_code || !newCustomerForm.customer_name) {
      alert('Customer Code and Name are required');
      return;
    }
    try {
      const response = await customersAPI.createCustomer(newCustomerForm);
      const created = response?.data || newCustomerForm;
      setCustomerEntry({
        customerId: created.customer_code,
        customerName: created.customer_name,
        mobile: created.mobile || '',
        address: created.address || '',
      });
      setNewCustomerDialog(false);
      setNewCustomerForm({ customer_code: '', customer_name: '', mobile: '', address: '' });
      setBillingError('');
      alert('Customer created successfully');
    } catch (error) {
      alert(error?.message || 'Failed to create customer');
    }
  };

  const addItem = (item, options = {}) => {
    const addPieces = Math.max(1, Number(options.pieces ?? 1) || 1);
    const meterCut = Math.max(0.1, Number(options.meterCut ?? 1) || 1);
    const addQty = Math.max(0.1, Number((addPieces * meterCut).toFixed(2)));
    const lineRate = Math.max(0, Number(options.rate ?? item.price ?? 0));
    const lineTax = Math.min(100, Math.max(0, Number(options.tax ?? item.tax ?? 0)));
    const lineDiscountPct = Math.min(100, Math.max(0, Number(options.discountPct ?? 0)));
    const lineServicePct = Math.min(100, Math.max(0, Number(options.servicePct ?? 0)));

    setCart((prev) => {
      const usedQty = prev
        .filter((x) => String(x.id) === String(item.id))
        .reduce((sum, x) => sum + Number(x.qty || 0), 0);
      if (usedQty + addQty > item.stock) {
        alert(`⚠️ INSUFFICIENT STOCK\n\nItem: ${item.name}\nAvailable Stock: ${item.stock} m\nRequested: ${addQty} m\nAlready in Cart: ${usedQty} m\n\nPlease reduce quantity or remove this item.`);
        setBillingError(`Insufficient stock for ${item.name}. Available: ${item.stock} m`);
        return prev;
      }
      setBillingError('');
      return [
        ...prev,
        {
          lineId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          id: item.id,
          barcode: item.barcode || '',
          code: item.code,
          name: item.name,
          qty: addQty,
          pieces: addPieces,
          meterCut,
          rate: lineRate,
          mrp: Math.max(0, Number(options.mrp ?? item.mrp ?? item.price ?? lineRate)),
          tax: lineTax,
          stock: item.stock,
          unit: item.unit || 'MTR',
          fabricType: item.fabricType,
          color: item.color,
          widthInch: item.widthInch,
          discountPct: lineDiscountPct,
          servicePct: lineServicePct,
        },
      ];
    });
  };

  const handleFabricEntryChange = (field, value) => {
    setFabricEntry((prev) => ({ ...prev, [field]: value }));
  };

  const getEditableLineSnapshot = (line = {}, draft = {}) => {
    const pieces = Math.max(1, Number(draft.pieces ?? line.pieces ?? 1) || 1);
    const meterCut = Math.max(0.1, Number(draft.meterCut ?? line.meterCut ?? 1) || 1);
    const rate = Math.max(0, Number(draft.rate ?? line.rate ?? 0) || 0);
    const qty = Number((pieces * meterCut).toFixed(2));

    const discountPct = Math.min(100, Math.max(0, Number(line.discountPct || 0) || 0));
    const base = qty * rate;
    const lineDiscount = (base * discountPct) / 100;
    const taxable = Math.max(base - lineDiscount, 0);

    const taxInputMode = draft.taxInputMode || 'tax';
    let tax = Math.max(0, Number(draft.tax ?? line.tax ?? 0) || 0);
    let taxAmount = Math.max(0, Number(draft.taxAmount ?? (taxable * tax) / 100) || 0);

    if (taxInputMode === 'taxAmount') {
      tax = taxable > 0 ? (taxAmount / taxable) * 100 : 0;
    } else {
      tax = Math.min(100, tax);
      taxAmount = (taxable * tax) / 100;
    }

    const servicePct = Math.min(100, Math.max(0, Number(line.servicePct || 0) || 0));
    const serviceAmount = (taxable * servicePct) / 100;
    const amount = taxable + taxAmount + serviceAmount;

    return {
      pieces,
      meterCut,
      rate,
      qty,
      taxable,
      tax: Number(tax.toFixed(4)),
      taxAmount: Number(taxAmount.toFixed(2)),
      amount: Number(amount.toFixed(2)),
      taxInputMode,
    };
  };

  const mapBackendItemToCatalog = (item, fallbackBarcode = '') => ({
    id: item.item_id || item.id,
    barcode: item.barcode || item.item_code || fallbackBarcode,
    code: item.item_code || '',
    name: item.item_name || '',
    price: Number(item.selling_price ?? item.sale_price ?? 0),
    mrp: Number(item.selling_price ?? item.sale_price ?? 0),
    tax: Number(item.tax_percentage ?? item.tax ?? 0),
    stock: Number(item.current_stock ?? item.stock ?? 0),
    unit: item.unit_name || item.unit || 'MTR',
    fabricType: item.fabric_type || '',
    color: item.color || '',
    widthInch: Number(item.width_inch || 0),
  });

  const resolveCatalogItemFromBarcode = async (rawBarcode = '') => {
    const barcode = String(rawBarcode || '').trim();
    if (!barcode) return null;

    const upper = barcode.toUpperCase();
    const exactLocal = catalogItems.find((x) => {
      const itemBarcode = String(x.barcode || '').trim().toUpperCase();
      const itemCode = String(x.code || '').trim().toUpperCase();
      return itemBarcode === upper || itemCode === upper;
    });
    if (exactLocal) return exactLocal;

    const startsWithLocal = catalogItems.find((x) => {
      const itemBarcode = String(x.barcode || '').trim().toUpperCase();
      const itemCode = String(x.code || '').trim().toUpperCase();
      return itemBarcode.startsWith(upper) || itemCode.startsWith(upper);
    });
    if (startsWithLocal) return startsWithLocal;

    try {
      const response = await itemsAPI.getItemByBarcode(barcode);
      const backendItem = response?.data?.data || response?.data;
      if (!backendItem) return null;
      const mapped = mapBackendItemToCatalog(backendItem, barcode);
      setCatalogItems((prev) => {
        const exists = prev.some((p) => String(p.id) === String(mapped.id));
        return exists ? prev : [mapped, ...prev];
      });
      return mapped;
    } catch (error) {
      return null;
    }
  };

  const handleBarcodeChange = async (value) => {
    const barcode = String(value || '').trim();
    setFabricEntry((prev) => ({ ...prev, barcode: value }));

    if (!barcode) {
      setBarcodeOptions([]);
      return;
    }

    // Search for variants
    const variants = catalogItems.filter((x) => {
      const itemBarcode = String(x.barcode || '').trim().toUpperCase();
      const itemCode = String(x.code || '').trim().toUpperCase();
      const searchBarcode = barcode.toUpperCase();
      return (
        itemBarcode.startsWith(searchBarcode) ||
        itemCode.startsWith(searchBarcode)
      );
    });

    if (variants.length > 0) {
      setBarcodeOptions(variants);
    } else {
      // Try backend search
      try {
        const searchResponse = await itemsAPI.searchItems(barcode);
        const searchResults = Array.isArray(searchResponse?.data) ? searchResponse.data : [];
        const backendVariants = searchResults.filter((item) => {
          const itemBarcode = String(item.barcode || '').trim().toUpperCase();
          const itemCode = String(item.item_code || '').trim().toUpperCase();
          const searchBarcode = barcode.toUpperCase();
          return (
            itemBarcode.startsWith(searchBarcode) ||
            itemCode.startsWith(searchBarcode)
          );
        });

        if (backendVariants.length > 0) {
          const mappedVariants = backendVariants.map(item => mapBackendItemToCatalog(item, item.barcode));
          setBarcodeOptions(mappedVariants);
        } else {
          setBarcodeOptions([]);
        }
      } catch (error) {
        setBarcodeOptions([]);
      }
    }
  };

  const selectBarcodeOption = (item) => {
    setBarcodeOptions([]);

    let detectedMeter = '1';
    const barcodeUpper = String(item.barcode || '').toUpperCase();
    if (barcodeUpper.includes('-1M')) {
      detectedMeter = '1';
    } else if (barcodeUpper.includes('-3M')) {
      detectedMeter = '3';
    } else if (barcodeUpper.includes('-5M')) {
      detectedMeter = '5';
    } else if (barcodeUpper.includes('-10M')) {
      detectedMeter = '10';
    } else if (barcodeUpper.includes('ROLL') || item.unit?.toUpperCase() === 'ROLL') {
      detectedMeter = 'Roll';
    }

    setFabricEntry({
      barcode: item.barcode || item.code,
      item_name: item.name,
      meters: detectedMeter,
      qty: '1',
      rate: String(Number(item.price || 0)),
      tax: String(Number(item.tax || 0)),
      discountPct: '0',
      servicePct: '0',
    });
    setBillingError('');
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const handleBarcodeEnter = async () => {
    const barcode = String(fabricEntry.barcode || '').trim();
    if (!barcode) return;

    const matchedFromOptions = barcodeOptions.find((x) => {
      const itemBarcode = String(x.barcode || '').trim().toUpperCase();
      const itemCode = String(x.code || '').trim().toUpperCase();
      const input = barcode.toUpperCase();
      return itemBarcode === input || itemCode === input;
    }) || barcodeOptions[0];

    if (matchedFromOptions) {
      selectBarcodeOption(matchedFromOptions);
      return;
    }

    const resolved = await resolveCatalogItemFromBarcode(barcode);
    if (resolved) {
      selectBarcodeOption(resolved);
      return;
    }

    setBillingError(`No item found for barcode: ${barcode}`);
  };

  const saveFabricFromBilling = async () => {
    const meters = Math.max(0.1, Number(fabricEntry.meters || 1));
    const qty = Math.max(1, Number(fabricEntry.qty || 1));
    const rate = Number(fabricEntry.rate || 0);
    const tax = Number(fabricEntry.tax || 0);
    const discountPct = Math.min(100, Math.max(0, Number(fabricEntry.discountPct || 0)));
    const servicePct = Math.min(100, Math.max(0, Number(fabricEntry.servicePct || 0)));

    // If editing an existing line, just update quantities (and validate)
    if (editingLineId) {
      if (meters <= 0) {
        setBillingError('Meters must be greater than 0');
        return;
      }
      if (qty <= 0) {
        setBillingError('Quantity must be greater than 0');
        return;
      }
      updateLine(editingLineId, {
        pieces: qty,
        meterCut: meters,
      });
      setEditingLineId(null);
      setFabricEntry({
        barcode: '',
        item_name: '',
        meters: '1',
        qty: '1',
        rate: '',
        tax: '',
        discountPct: '0',
        servicePct: '0',
      });
      setBillingError('');
      return;
    }

    const barcode = String(fabricEntry.barcode || '').trim();
    const itemName = fabricEntry.item_name.trim();
    const mappedByBarcode = catalogItems.find(
      (x) =>
        String(x.barcode || '').trim() === barcode ||
        String(x.code || '').trim() === barcode
    );
    const resolvedItemName = itemName || mappedByBarcode?.name || '';

    if (!barcode) {
      setBillingError('Barcode is required');
      return;
    }
    if (!resolvedItemName) {
      setBillingError('Item is required');
      return;
    }
    if (meters <= 0) {
      setBillingError('Meters must be greater than 0');
      return;
    }
    if (rate <= 0) {
      setBillingError('Rate must be greater than 0');
      return;
    }
    try {
      let mapped = mappedByBarcode;
      if (!mapped) {
        try {
          const response = await itemsAPI.getItemByBarcode(barcode);
          const backendItem = response?.data?.data || response?.data;
          if (backendItem) {
            mapped = mapBackendItemToCatalog(backendItem, barcode);
            setCatalogItems((prev) => {
              const exists = prev.some((p) => String(p.id) === String(mapped.id));
              return exists ? prev : [mapped, ...prev];
            });
          }
        } catch (error) {
          // handled below
        }
      }
      if (!mapped) {
        setBillingError(`No item found for barcode: ${barcode}. Add it in inventory first.`);
        return;
      }

      addItem(mapped, {
        pieces: qty,
        meterCut: meters,
        rate,
        tax,
        discountPct,
        servicePct,
      });
      setBillingError('');
      setFabricEntry({
        barcode: '',
        item_name: '',
        meters: '1',
        qty: '1',
        rate: '',
        tax: '',
        discountPct: '0',
        servicePct: '0',
      });
    } catch (error) {
      setBillingError(error?.message || 'Failed to save fabric from billing');
    }
  };

  const updateLine = (lineId, changes = {}, sourceField = '') => {
    setCart((prev) =>
      prev.map((x) => {
        if (x.lineId !== lineId) return x;
        const taxInputMode =
          sourceField === 'taxAmount'
            ? 'taxAmount'
            : sourceField === 'tax'
              ? 'tax'
              : changes.taxInputMode || 'tax';
        const snapshot = getEditableLineSnapshot(x, { ...changes, taxInputMode });
        const nextQty = snapshot.qty;
        const usedByOtherLines = prev
          .filter((row) => row.lineId !== lineId && String(row.id) === String(x.id))
          .reduce((sum, row) => sum + Number(row.qty || 0), 0);
        if (usedByOtherLines + nextQty > (x.stock || 0)) {
          alert(`⚠️ INSUFFICIENT STOCK\n\nItem: ${x.name}\nAvailable Stock: ${x.stock} m\nRequested: ${nextQty} m\nAlready in Cart: ${usedByOtherLines} m\n\nPlease reduce quantity.`);
          setBillingError(`Insufficient stock for ${x.name}. Available: ${x.stock} m`);
          return x;
        }
        setBillingError('');
        return {
          ...x,
          pieces: snapshot.pieces,
          meterCut: snapshot.meterCut,
          qty: snapshot.qty,
          rate: snapshot.rate,
          tax: snapshot.tax,
        };
      })
    );
  };

  const startEditLine = (line) => {
    setEditingLineId(line.lineId);
    const snapshot = getEditableLineSnapshot(line, { taxInputMode: 'tax' });
    setEditingRowData({
      pieces: snapshot.pieces,
      meterCut: snapshot.meterCut,
      rate: snapshot.rate,
      tax: snapshot.tax,
      taxAmount: snapshot.taxAmount,
      taxInputMode: 'tax',
    });
    setBillingError('');
  };

  const saveEditLine = (lineId) => {
    updateLine(lineId, editingRowData, editingRowData.taxInputMode || 'tax');
    setEditingLineId(null);
    setEditingRowData({});
  };

  const cancelEditLine = () => {
    setEditingLineId(null);
    setEditingRowData({});
  };

  const removeItem = (lineId) => {
    setCart((prev) => prev.filter((x) => x.lineId !== lineId));
    if (editingLineId === lineId) {
      setEditingLineId(null);
    }
  };

  const clearBill = () => {
    setCart([]);
    setEditingLineId(null);
    setEditingRowData({});
    setCashDiscountPercent(0);
    setCouponDiscount(0);
    setServiceChargePercent(0);
    setSurchargePercent(0);
    setFreightCharge(0);
    setPackingCharge(0);
    setOtherCharge(0);
    setExtraCharge(0);
    setAlbumCharge(0);
    setManualTaxable('');
    setManualTaxAmount('');
    setManualServiceCharge('');
    setManualRoundOff('');
    setManualSurchargeIncl('');
    setBillNoSeed(Date.now());
    setBillingError('');
    setEditingHoldId('');
    setEditingHoldInvoiceNo('');
    setFabricEntry((prev) => ({
      ...prev,
      barcode: '',
      item_name: '',
      meters: '1',
      qty: '1',
      rate: '',
      tax: '',
      discountPct: '0',
      servicePct: '0',
    }));
    setCustomerEntry({
      customerId: '',
      customerName: '',
      mobile: '',
      address: '',
    });
  };

  const totals = useMemo(() => {
    const computed = cart.map((line) => {
      const base = line.qty * line.rate;
      const lineDiscount = (base * (line.discountPct || 0)) / 100;
      const taxable = Math.max(base - lineDiscount, 0);
      const taxAmount = (taxable * line.tax) / 100;
      const serviceAmount = (taxable * (line.servicePct || 0)) / 100;
      const amount = taxable + taxAmount + serviceAmount;
      return { ...line, base, lineDiscount, taxable, taxAmount, serviceAmount, amount };
    });

    const gross = computed.reduce((s, i) => s + i.base, 0);
    const lineDiscountTotal = computed.reduce((s, i) => s + i.lineDiscount, 0);
    const baseTaxableAmount = computed.reduce((s, i) => s + i.taxable, 0);
    const baseTax = computed.reduce((s, i) => s + i.taxAmount, 0);
    const itemLevelService = computed.reduce((s, i) => s + i.serviceAmount, 0);
    const billServicePct = Math.min(100, Math.max(0, Number(serviceChargePercent) || 0));
    const billServiceAmount = (baseTaxableAmount * billServicePct) / 100;
    const surchargePct = Math.min(100, Math.max(0, Number(surchargePercent) || 0));
    const baseServiceCharge = (baseTaxableAmount * surchargePct) / 100;
    const service = itemLevelService + billServiceAmount;

    // Apply manual overrides when user enters values
    const taxableAmount =
      manualTaxable !== '' && !Number.isNaN(Number(manualTaxable))
        ? Number(manualTaxable)
        : baseTaxableAmount;
    const tax =
      manualTaxAmount !== '' && !Number.isNaN(Number(manualTaxAmount))
        ? Number(manualTaxAmount)
        : baseTax;
    let surcharge =
      manualServiceCharge !== '' && !Number.isNaN(Number(manualServiceCharge))
        ? Number(manualServiceCharge)
        : baseServiceCharge;

    // If user edits "Surcharge (Incl)" treat it as tax + surcharge
    if (manualSurchargeIncl !== '' && !Number.isNaN(Number(manualSurchargeIncl))) {
      const desiredIncl = Number(manualSurchargeIncl);
      surcharge = Math.max(0, desiredIncl - tax);
    }

    const subTotal = taxableAmount + tax + surcharge + service;
    const cashDiscountAmt = (subTotal * Math.min(100, Math.max(0, Number(cashDiscountPercent) || 0))) / 100;
    const couponDiscountAmt = Math.max(0, Number(couponDiscount) || 0);
    const preRoundNet = Math.max(subTotal - cashDiscountAmt, 0)
      - couponDiscountAmt
      + (Number(freightCharge) || 0)
      + (Number(packingCharge) || 0)
      + (Number(otherCharge) || 0)
      + (Number(extraCharge) || 0)
      + (Number(albumCharge) || 0);

    const baseRoundedNet = Math.round(preRoundNet);
    const baseRoundOff = Number((baseRoundedNet - preRoundNet).toFixed(2));

    const roundOff =
      manualRoundOff !== '' && !Number.isNaN(Number(manualRoundOff))
        ? Number(manualRoundOff)
        : baseRoundOff;
    const net = Math.round(preRoundNet + roundOff);

    return {
      computed,
      gross,
      lineDiscountTotal,
      taxableAmount,
      taxInclusive: tax + surcharge,
      service,
      itemLevelService,
      serviceChargePct: billServicePct,
      serviceChargeAmount: billServiceAmount,
      surchargePct,
      surcharge,
      subTotal,
      cashDiscountAmt,
      couponDiscountAmt,
      preRoundNet,
      roundOff,
      tax,
      net,
      qty: cart.reduce((s, i) => s + i.qty, 0),
      lines: cart.length,
    };
  }, [
    cart,
    cashDiscountPercent,
    couponDiscount,
    serviceChargePercent,
    surchargePercent,
    freightCharge,
    packingCharge,
    otherCharge,
    extraCharge,
    albumCharge,
    manualTaxable,
    manualTaxAmount,
    manualServiceCharge,
    manualRoundOff,
    manualSurchargeIncl,
  ]);

  const currentBillNo = useMemo(
    () => buildInvoiceNo(new Date(billNoSeed)),
    [billNoSeed]
  );

  const hasDraftSale = useMemo(() => {
    if (cart.length > 0) return true;
    if (String(customerEntry.customerId || '').trim()) return true;
    if (String(customerEntry.customerName || '').trim()) return true;
    if (String(customerEntry.mobile || '').trim()) return true;
    if (String(customerEntry.address || '').trim()) return true;
    if (String(fabricEntry.barcode || '').trim()) return true;
    if (String(fabricEntry.item_name || '').trim()) return true;
    if (String(fabricEntry.rate || '').trim()) return true;
    if (String(fabricEntry.tax || '').trim()) return true;
    if (String(fabricEntry.qty || '').trim() && String(fabricEntry.qty || '').trim() !== '1') return true;
    if (String(fabricEntry.meters || '').trim() && String(fabricEntry.meters || '').trim() !== '1') return true;
    return false;
  }, [cart.length, customerEntry, fabricEntry]);

  const mapHoldLineToCartLine = useCallback(
    (line = {}, idx = 0) => {
      const catalogMatch = catalogItems.find(
        (item) =>
          String(item.id || '') === String(line.id || '') ||
          String(item.barcode || '').trim() === String(line.barcode || '').trim() ||
          String(item.code || '').trim() === String(line.code || '').trim()
      );
      const pieces = Math.max(1, Number(line.quantity || line.pieces || 1) || 1);
      const rawQty = Math.max(0.1, Number(line.qty || 0) || 0.1);
      const meterCut = Math.max(0.1, Number(line.meterCut || rawQty / pieces) || 1);
      const qty = Number((pieces * meterCut).toFixed(2));

      return {
        lineId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        id: line.id || catalogMatch?.id || '',
        barcode: line.barcode || catalogMatch?.barcode || '',
        code: line.code || catalogMatch?.code || '',
        name: line.name || catalogMatch?.name || '',
        qty,
        pieces,
        meterCut,
        rate: Number(line.rate || 0),
        mrp: Math.max(0, Number(line.mrp ?? line.rate ?? 0)),
        tax: Math.min(100, Math.max(0, Number(line.taxPct ?? line.tax ?? 0))),
        stock: Number(catalogMatch?.stock ?? line.stock ?? qty),
        unit: catalogMatch?.unit || 'MTR',
        fabricType: catalogMatch?.fabricType || '',
        color: catalogMatch?.color || '',
        widthInch: Number(catalogMatch?.widthInch || 0),
        discountPct: Math.min(100, Math.max(0, Number(line.discountPct || 0))),
        servicePct: Math.min(100, Math.max(0, Number(line.servicePct || 0))),
      };
    },
    [catalogItems]
  );

  const openHoldBill = useCallback(
    (bill = {}) => {
      const holdLines = Array.isArray(bill.items) ? bill.items : [];
      const mappedLines = holdLines.map((line, idx) => mapHoldLineToCartLine(line, idx));

      setCart(mappedLines);
      setCustomerEntry({
        customerId: String(bill.customerId || bill.customerCode || ''),
        customerName: String(bill.customerName || ''),
        mobile: String(bill.customerMobile || ''),
        address: String(bill.customerAddress || ''),
      });
      setPaymentMode(String(bill.paymentMode || 'CASH').toUpperCase());
      setSaleSource(String(bill.source || 'MANUAL').toUpperCase());
      setBillDate(String(bill.billDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10));
      setCashDiscountPercent(Number(bill.billDiscountPct || 0));
      setCouponDiscount(Number(bill.couponDiscount || 0));
      setServiceChargePercent(Number(bill.serviceChargePct || 0));
      setSurchargePercent(Number(bill.surchargePct || 0));
      setFreightCharge(Number(bill.freightAmount || 0));
      setPackingCharge(Number(bill.packingCharge || 0));
      setOtherCharge(Number(bill.otherCharge || 0));
      setExtraCharge(Number(bill.extraCharge || 0));
      setAlbumCharge(Number(bill.albumCharge || 0));
      setManualTaxable('');
      setManualTaxAmount('');
      setManualServiceCharge('');
      setManualRoundOff('');
      setManualSurchargeIncl('');
      setEditingLineId(null);
      setEditingRowData({});
      setFabricEntry({
        barcode: '',
        item_name: '',
        meters: '1',
        qty: '1',
        rate: '',
        tax: '',
        discountPct: '0',
        servicePct: '0',
      });
      setEditingHoldId(String(bill.id || ''));
      setEditingHoldInvoiceNo(String(bill.invoiceNo || ''));
      setBillingError('');
      setTabValue(0);
      alert(`Hold bill loaded: ${bill.invoiceNo || '-'}`);
    },
    [mapHoldLineToCartLine]
  );

  const deleteHoldBill = useCallback(
    async (bill = {}) => {
      const id = String(bill.id || '').trim();
      if (!id) {
        setBillingError('Invalid hold bill');
        return;
      }
      const invoiceNo = String(bill.invoiceNo || id);
      const confirmed = window.confirm(`Delete hold bill ${invoiceNo}?`);
      if (!confirmed) return;

      try {
        await salesAPI.deleteBill(id);
        await refreshSalesHistory();
        alert(`Hold bill deleted: ${invoiceNo}`);

        if (String(editingHoldId || '') === id) {
          clearBill();
        }
      } catch (error) {
        setBillingError(error?.message || 'Failed to delete hold bill');
      }
    },
    [clearBill, editingHoldId, refreshSalesHistory]
  );

  const editSalesBill = useCallback(
    (bill = {}) => {
      const billLines = Array.isArray(bill.items) ? bill.items : [];
      if (billLines.length === 0) {
        setBillingError('Selected bill has no items');
        return;
      }

      const mappedLines = billLines.map((line, idx) => mapHoldLineToCartLine(line, idx));

      setCart(mappedLines);
      setCustomerEntry({
        customerId: String(bill.customerId || bill.customerCode || ''),
        customerName: String(bill.customerName || ''),
        mobile: String(bill.customerMobile || ''),
        address: String(bill.customerAddress || ''),
      });
      setPaymentMode(String(bill.paymentMode || 'CASH').toUpperCase());
      setSaleSource(String(bill.source || 'MANUAL').toUpperCase());
      setBillDate(String(bill.billDate || '').slice(0, 10) || new Date().toISOString().slice(0, 10));
      setCashDiscountPercent(Number(bill.billDiscountPct || 0));
      setCouponDiscount(Number(bill.couponDiscount || 0));
      setServiceChargePercent(Number(bill.serviceChargePct || 0));
      setSurchargePercent(Number(bill.surchargePct || 0));
      setFreightCharge(Number(bill.freightAmount || 0));
      setPackingCharge(Number(bill.packingCharge || 0));
      setOtherCharge(Number(bill.otherCharge || 0));
      setExtraCharge(Number(bill.extraCharge || 0));
      setAlbumCharge(Number(bill.albumCharge || 0));
      setManualTaxable('');
      setManualTaxAmount('');
      setManualServiceCharge('');
      setManualRoundOff('');
      setManualSurchargeIncl('');
      setEditingLineId(null);
      setEditingRowData({});
      setFabricEntry({
        barcode: '',
        item_name: '',
        meters: '1',
        qty: '1',
        rate: '',
        tax: '',
        discountPct: '0',
        servicePct: '0',
      });
      setEditingHoldId(String(bill.id || ''));
      setEditingHoldInvoiceNo(String(bill.invoiceNo || ''));
      setBillingError('');
      setTabValue(0);
      alert(`Editing bill: ${bill.invoiceNo || '-'}`);
    },
    [mapHoldLineToCartLine]
  );

  const saveBill = useCallback(
    async (hold = false, options = {}) => {
      const { nextTabOnSuccess = null } = options;
      if (isSavingBill) return;

      if (!hold && cart.length === 0) {
        setBillingError('No fabric added');
        return;
      }

      if (hold && !hasDraftSale) {
        setBillingError('Enter at least one detail before holding bill');
        return;
      }

      setBillingError('');
      if (!hold && customerEntry.customerId && !customerEntry.customerName) {
        setBillingError('Enter a valid Customer ID');
        return;
      }

      if (!hold) {
        const stockChecks = totals.computed.filter((line) => line.qty > (line.stock || 0));
        if (stockChecks.length > 0) {
          setBillingError(`Insufficient stock for ${stockChecks[0].name}. Available: ${stockChecks[0].stock} m`);
          return;
        }
      }

      const now = new Date();
      let invoiceNo = editingHoldInvoiceNo || buildInvoiceNo(new Date(billNoSeed));
      let bill = {
        id: editingHoldId || now.getTime(),
        invoiceNo,
        bill_no: invoiceNo,
        customerId: customerEntry.customerId || '',
        customerName: customerEntry.customerName || 'Cash Customer',
        customerCode: customerEntry.customerId || '',
        customerMobile: customerEntry.mobile || '',
        customerAddress: customerEntry.address || '',
        paymentMode,
        billDate,
        totalItems: totals.lines,
        totalMeters: Number(totals.qty.toFixed(2)),
        netAmount: totals.net,
        paymentStatus: paymentMode === 'CREDIT' ? 'PENDING' : 'COMPLETED',
        paidAmount: paymentMode === 'CREDIT' ? 0 : Number(totals.net.toFixed(2)),
        dueAmount: paymentMode === 'CREDIT' ? Number(totals.net.toFixed(2)) : 0,
        source: saleSource,
        billType: 'SALES',
        isHold: !!hold,
        items: totals.computed.map((x) => ({
          id: x.id,
          barcode: x.barcode || '',
          code: x.code,
          name: x.name,
          qty: x.qty,
          quantity: Number(x.pieces || 1),
          meterCut: Number(x.meterCut || 1),
          rate: x.rate,
          taxPct: x.tax,
          taxAmount: x.taxAmount,
          discountPct: x.discountPct,
          discountAmount: x.lineDiscount,
          servicePct: x.servicePct,
          serviceAmount: x.serviceAmount,
          amount: x.amount,
        })),
        grossAmount: totals.gross,
        lineDiscountAmount: totals.lineDiscountTotal,
        taxableAmount: totals.taxableAmount,
        taxAmount: totals.tax,
        taxInclusiveAmount: totals.taxInclusive,
        surchargePct: totals.surchargePct,
        surchargeAmount: totals.surcharge,
        serviceChargePct: totals.serviceChargePct,
        serviceChargeAmount: totals.service,
        freightAmount: Number(freightCharge) || 0,
        packingCharge: Number(packingCharge) || 0,
        otherCharge: Number(otherCharge) || 0,
        extraCharge: Number(extraCharge) || 0,
        albumCharge: Number(albumCharge) || 0,
        roundOff: totals.roundOff,
        billDiscountPct: Number(cashDiscountPercent) || 0,
        billDiscount: totals.cashDiscountAmt,
        couponDiscount: totals.couponDiscountAmt,
        createdAt: now.toISOString(),
      };

      setIsSavingBill(true);
      try {
        let salesSaveResult;
        if (editingHoldId) {
          salesSaveResult = await salesAPI.updateBill(editingHoldId, bill);
        } else {
          try {
            salesSaveResult = await salesAPI.createBill(bill);
          } catch (error) {
            const msg = String(error?.message || '').toLowerCase();
            const isDuplicate = msg.includes('duplicate') || msg.includes('e11000');
            if (!isDuplicate) {
              throw error;
            }
            const retryNow = new Date();
            invoiceNo = buildInvoiceNo(retryNow);
            bill = { ...bill, invoiceNo, bill_no: invoiceNo };
            salesSaveResult = await salesAPI.createBill(bill);
          }
        }

        if (!hold) {
          Promise.allSettled(
            totals.computed.map((line) =>
              inventoryAPI.adjustStock({
                itemId: line.id,
                quantity: -line.qty,
              })
            )
          ).then((results) => {
            const hasFailure = results.some((r) => r.status === 'rejected');
            if (hasFailure) {
              setBillingError('Bill saved but some stock updates failed. Please verify inventory.');
            }
          });

          setCatalogItems((prev) =>
            prev.map((item) => {
              const soldLine = totals.computed.find((line) => line.id === item.id);
              if (!soldLine) return item;
              return {
                ...item,
                stock: Number(Math.max(0, (item.stock || 0) - soldLine.qty).toFixed(2)),
              };
            })
          );
        }

        await refreshSalesHistory();
        alert(hold ? 'Bill held' : 'Bill saved');
        clearBill();
        if (nextTabOnSuccess !== null) {
          setTabValue(nextTabOnSuccess);
        }
      } catch (error) {
        setBillingError(error?.message || 'Failed to save sale in backend');
      } finally {
        setIsSavingBill(false);
      }
    },
    [
      albumCharge,
      billDate,
      billNoSeed,
      cart,
      cashDiscountPercent,
      clearBill,
      couponDiscount,
      customerEntry,
      editingHoldId,
      editingHoldInvoiceNo,
      extraCharge,
      freightCharge,
      hasDraftSale,
      isSavingBill,
      otherCharge,
      packingCharge,
      paymentMode,
      refreshSalesHistory,
      saleSource,
      surchargePercent,
      serviceChargePercent,
      totals,
    ]
  );

  const handleMainTabChange = useCallback(
    (_event, nextTab) => {
      if (nextTab === 2 && tabValue === 0 && hasDraftSale) {
        saveBill(true, { nextTabOnSuccess: 2 });
        return;
      }
      setTabValue(nextTab);
    },
    [hasDraftSale, saveBill, tabValue]
  );

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return salesHistory
      .filter((bill) => !bill.isHold)
      .filter((bill) => (historySource ? bill.source === historySource : true))
      .filter((bill) => (historyStatus ? bill.paymentStatus === historyStatus : true))
      .filter((bill) => {
        if (!q) return true;
        const inInvoice = String(bill.invoiceNo || '').toLowerCase().includes(q);
        const inCustomer = String(bill.customerName || '').toLowerCase().includes(q);
        const inItems = (bill.items || []).some(
          (line) =>
            String(line.barcode || '').toLowerCase().includes(q) ||
            String(line.name || '').toLowerCase().includes(q) ||
            String(line.code || '').toLowerCase().includes(q)
        );
        return inInvoice || inCustomer || inItems;
      })
      .filter((bill) => {
        if (!historyDateFrom && !historyDateTo) return true;
        const d = new Date(bill.createdAt);
        const fromOk = historyDateFrom ? d >= new Date(`${historyDateFrom}T00:00:00`) : true;
        const toOk = historyDateTo ? d <= new Date(`${historyDateTo}T23:59:59`) : true;
        return fromOk && toOk;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [salesHistory, historySource, historyStatus, historyQuery, historyDateFrom, historyDateTo]);

  const filteredHoldHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return salesHistory
      .filter((bill) => bill.isHold && String(bill.billType || 'SALES').toUpperCase() === 'SALES')
      .filter((bill) => (historySource ? bill.source === historySource : true))
      .filter((bill) => (historyStatus ? bill.paymentStatus === historyStatus : true))
      .filter((bill) => {
        if (!q) return true;
        const inInvoice = String(bill.invoiceNo || '').toLowerCase().includes(q);
        const inCustomer = String(bill.customerName || '').toLowerCase().includes(q);
        const inItems = (bill.items || []).some(
          (line) =>
            String(line.barcode || '').toLowerCase().includes(q) ||
            String(line.name || '').toLowerCase().includes(q) ||
            String(line.code || '').toLowerCase().includes(q)
        );
        return inInvoice || inCustomer || inItems;
      })
      .filter((bill) => {
        if (!historyDateFrom && !historyDateTo) return true;
        const d = new Date(bill.createdAt);
        const fromOk = historyDateFrom ? d >= new Date(`${historyDateFrom}T00:00:00`) : true;
        const toOk = historyDateTo ? d <= new Date(`${historyDateTo}T23:59:59`) : true;
        return fromOk && toOk;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [salesHistory, historySource, historyStatus, historyQuery, historyDateFrom, historyDateTo]);

  const historyStats = useMemo(() => {
    const salesOnly = filteredHistory.filter((x) => x.billType !== 'SALES_RETURN');
    const totalRevenue = salesOnly.reduce((sum, x) => sum + Number(x.netAmount || 0), 0);
    const completedSales = salesOnly.filter((x) => x.paymentStatus === 'COMPLETED').length;
    const pendingSales = salesOnly.filter(
      (x) => x.paymentStatus === 'PENDING' || x.paymentStatus === 'REFUND_PENDING'
    ).length;
    const uniqueCustomers = new Set(
      salesOnly.map((x) => String(x.customerName || '').trim()).filter(Boolean)
    ).size;
    return { totalRevenue, completedSales, pendingSales, uniqueCustomers };
  }, [filteredHistory]);

  const generateSalePdf = (bill, mode = 'download') => {
    generateInvoicePDF(bill, settings, mode);
  };

  const saleInvoices = useMemo(
    () =>
      salesHistory
        .filter((x) => x.billType === 'SALES' && !x.isHold)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [salesHistory]
  );

  const retrieveReturnInvoice = () => {
    const billNo = returnInvoiceNo.trim().toUpperCase();
    if (!billNo) {
      setReturnError('Enter invoice number');
      return;
    }

    const original = saleInvoices.find((x) => String(x.invoiceNo || '').toUpperCase() === billNo);
    if (!original) {
      setReturnInvoiceData(null);
      setReturnInvoiceId('');
      setReturnError('Invoice not found');
      return;
    }

    setReturnInvoiceId(String(original.id));
    setReturnInvoiceData(original);
    setReturnError('');
    setReturnQuantities({});
  };

  const processSalesReturn = async () => {
    if (!returnInvoiceId || !returnInvoiceData) {
      setReturnError('Retrieve invoice by bill number first');
      return;
    }

    const original = salesHistory.find((x) => String(x.id) === String(returnInvoiceId)) || returnInvoiceData;
    if (!original) {
      setReturnError('Original invoice not found');
      return;
    }

    const itemsToReturn = [];
    let hasError = false;

    (original.items || []).forEach(line => {
      const returnQty = Number(returnQuantities[line.id || line.code] || 0);
      if (returnQty > 0) {
        if (returnQty > Number(line.qty || 0)) {
          hasError = true;
          setReturnError(`Return quantity for ${line.name} cannot exceed sold quantity (${line.qty})`);
        }
        // Calculate proportional refund amount based on line rate/taxes conceptually
        const perItemValue = Number(line.qty || 0) > 0 ? Number(line.amount || 0) / Number(line.qty || 0) : 0;
        const returnedAmount = Number((perItemValue * returnQty).toFixed(2));

        itemsToReturn.push({
          itemId: line.id || line.itemId,
          barcode: line.barcode,
          itemName: line.name || line.itemName,
          code: line.code,
          qty: returnQty,
          returnedAmount
        });
      }
    });

    if (hasError) return;

    if (itemsToReturn.length === 0) {
      setReturnError('Enter at least one valid return quantity');
      return;
    }

    try {
      await returnsAPI.processReturn({
        originalInvoiceNo: original.invoiceNo,
        saleId: original.id,
        items: itemsToReturn,
        reason: 'Customer initiated return'
      });

      // Optimistically update stock in catalog
      setCatalogItems((prev) =>
        prev.map((item) => {
          const matchedReturnLine = itemsToReturn.find(r => String(r.itemId) === String(item.id));
          if (!matchedReturnLine) return item;
          return {
            ...item,
            stock: Number(((item.stock || 0) + matchedReturnLine.qty).toFixed(2)),
          };
        })
      );

      // Note: We deliberately do NOT update the `totalMeters` and `netAmount` on `original`,
      // because we want order history to correctly show what was originally bought.

      setReturnInvoiceId('');
      setReturnInvoiceNo('');
      setReturnInvoiceData(null);
      setReturnQuantities({});
      setReturnError('');
      alert(`Sales return processed: ${itemsToReturn.reduce((sum, item) => sum + item.qty, 0)} units returned. Inventory restocked.`);

    } catch (error) {
      setReturnError(error?.message || 'Failed to process return');
    }
  };

  const renderBillingTab = () => (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 1,
          borderRadius: 0,
          borderBottom: `3px solid ${ORANGE}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PointOfSale sx={{ mr: 1, color: ORANGE, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
              Sale Entry
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date().toDateString()}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={saleSource}
              label="Source"
              onChange={(e) => setSaleSource(e.target.value)}
            >
              <MenuItem value="MANUAL">Manual</MenuItem>
              <MenuItem value="WEBSITE">Website</MenuItem>
              <MenuItem value="AMAZON">Amazon</MenuItem>
              <MenuItem value="FLIPKART">Flipkart</MenuItem>
              <MenuItem value="MEESHO">Meesho</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel>Payment</InputLabel>
            <Select
              value={paymentMode}
              label="Payment"
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="UPI">UPI</MenuItem>
              <MenuItem value="CARD">Card</MenuItem>
              <MenuItem value="CREDIT">Credit</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {editingHoldId && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          Editing Hold Bill: {editingHoldInvoiceNo || editingHoldId}
        </Alert>
      )}

      {billingError && (
        <Alert severity="error" sx={{ borderRadius: 0 }} onClose={() => setBillingError('')}>
          {billingError}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: `1px solid ${GRID_BORDER}`,
          bgcolor: '#fff',
          flexShrink: 0,
        }}
      >
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer ID"
                  value={customerEntry.customerId}
                  onChange={(e) => setCustomerEntry(p => ({ ...p, customerId: e.target.value.toUpperCase() }))}
                  onBlur={() => lookupCustomerById()}
                  onKeyDown={(e) => e.key === 'Enter' && lookupCustomerById()}
                  placeholder="Scan/Type ID"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth size="small" label="Customer Name" value={customerEntry.customerName} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth size="small" label="Mobile" value={customerEntry.mobile} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth size="small" label="Address" value={customerEntry.address} InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} md={1}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setNewCustomerForm({ customer_code: customerEntry.customerId, customer_name: '', mobile: '', address: '' });
                      setNewCustomerDialog(true);
                    }}
                    sx={{ height: '40px', minWidth: 0, px: 1 }}
                    title="Create New Customer"
                  >
                    <PersonAdd fontSize="small" />
                  </Button>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5, textAlign: 'center' }}>
                    New Customer
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
              <Box sx={{ flex: 1, border: `1px solid ${GRID_BORDER}`, bgcolor: GRID_BG, p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#666' }}>SOURCE</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{saleSource}</Typography>
              </Box>
              <Box sx={{ flex: 1, border: `1px solid ${GRID_BORDER}`, bgcolor: GRID_BG, p: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#666' }}>MODE</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{paymentMode}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={1} alignItems="center">
          <Grid item xs={6} md={2}>
            <Autocomplete
              freeSolo
              options={barcodeOptions}
              ListboxProps={{ style: { maxHeight: 240, overflowY: 'auto' } }}
              getOptionLabel={(option) => typeof option === 'string' ? option : (option.barcode || option.code || '')}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.barcode || option.code}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.name}</Typography>
                  </Box>
                </Box>
              )}
              inputValue={fabricEntry.barcode}
              onInputChange={(e, value) => handleBarcodeChange(value)}
              onChange={(e, value) => {
                if (value && typeof value === 'object') {
                  selectBarcodeOption(value);
                } else if (typeof value === 'string' && value.trim()) {
                  handleBarcodeChange(value.trim());
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Barcode / Code"
                  inputRef={barcodeInputRef}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      await handleBarcodeEnter();
                    }
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" label="Item Description" value={fabricEntry.item_name} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={4} md={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Qty"
              value={fabricEntry.qty}
              onChange={(e) => handleFabricEntryChange('qty', e.target.value)}
              inputRef={qtyInputRef}
            />
          </Grid>
          <Grid item xs={4} md={1}>
            <TextField
              fullWidth
              size="small"
              label="Meters"
              value={fabricEntry.meters}
              InputProps={{ readOnly: true }}
              sx={{ bgcolor: '#f5f5f5' }}
            />
          </Grid>
          <Grid item xs={4} md={1}>
            <TextField fullWidth size="small" label="Rate" value={fabricEntry.rate} InputProps={{ readOnly: true }} />
          </Grid>
          <Grid item xs={4} md={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Tax %"
              value={fabricEntry.tax}
              onChange={(e) => handleFabricEntryChange('tax', e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={saveFabricFromBilling}
              sx={{ bgcolor: editingLineId ? '#1976d2' : ORANGE, '&:hover': { bgcolor: editingLineId ? '#115293' : '#e68900' }, fontWeight: 'bold' }}
            >
              {editingLineId ? 'UPDATE LINE' : 'ADD ITEM'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <TableContainer sx={{ flexGrow: 1 }}>
            <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse', '& td, & th': { border: '1px solid #ccc' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>#</TableCell>
                  <TableCell sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Barcode</TableCell>
                  <TableCell sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Item</TableCell>
                  <TableCell sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Code</TableCell>
                  <TableCell align="center" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Qty</TableCell>
                  <TableCell align="center" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Meters</TableCell>
                  <TableCell align="right" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Rate</TableCell>
                  <TableCell align="right" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Tax %</TableCell>
                  <TableCell align="right" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Tax Amt</TableCell>
                  <TableCell align="right" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Total</TableCell>
                  <TableCell align="center" sx={{ bgcolor: ORANGE, color: '#fff', fontWeight: 'bold', border: '1px solid #ccc' }}>Act</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 10, color: '#aaa' }}>
                      <Typography variant="h6">No items added</Typography>
                      <Typography variant="body2">Scan barcode or enter code to begin</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  totals.computed.map((line, index) => {
                    const isEditing = editingLineId === line.lineId;
                    const draftSnapshot = isEditing
                      ? getEditableLineSnapshot(line, editingRowData)
                      : null;
                    return (
                      <TableRow
                        key={line.lineId}
                        hover={!isEditing}
                        sx={{
                          bgcolor: isEditing ? '#fff3e0' : (index % 2 === 0 ? '#fff' : '#f5f5f5'),
                          '&:hover': !isEditing ? { bgcolor: '#ffe0b2' } : {}
                        }}
                      >
                        <TableCell sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>{index + 1}</TableCell>
                        <TableCell sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>{line.barcode}</TableCell>
                        <TableCell sx={{ fontWeight: 500, bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>{line.name}</TableCell>
                        <TableCell sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>{line.code}</TableCell>
                        <TableCell align="center" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editingRowData.pieces ?? line.pieces}
                              onChange={(e) =>
                                setEditingRowData((prev) => {
                                  const nextDraft = { ...prev, pieces: Number(e.target.value) };
                                  const snapshot = getEditableLineSnapshot(line, nextDraft);
                                  return {
                                    ...nextDraft,
                                    tax: snapshot.tax,
                                    taxAmount: snapshot.taxAmount,
                                    taxInputMode: snapshot.taxInputMode,
                                  };
                                })
                              }
                              sx={{ width: 70 }}
                              inputProps={{ min: 1, step: 1 }}
                            />
                          ) : (
                            Number(line.pieces)
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editingRowData.meterCut ?? line.meterCut}
                              onChange={(e) =>
                                setEditingRowData((prev) => {
                                  const nextDraft = { ...prev, meterCut: Number(e.target.value) };
                                  const snapshot = getEditableLineSnapshot(line, nextDraft);
                                  return {
                                    ...nextDraft,
                                    tax: snapshot.tax,
                                    taxAmount: snapshot.taxAmount,
                                    taxInputMode: snapshot.taxInputMode,
                                  };
                                })
                              }
                              sx={{ width: 70 }}
                              inputProps={{ min: 0.1, step: 0.1 }}
                            />
                          ) : (
                            Number(line.meterCut)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editingRowData.rate ?? line.rate}
                              onChange={(e) =>
                                setEditingRowData((prev) => {
                                  const nextDraft = { ...prev, rate: Number(e.target.value) };
                                  const snapshot = getEditableLineSnapshot(line, nextDraft);
                                  return {
                                    ...nextDraft,
                                    tax: snapshot.tax,
                                    taxAmount: snapshot.taxAmount,
                                    taxInputMode: snapshot.taxInputMode,
                                  };
                                })
                              }
                              sx={{ width: 90 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          ) : (
                            line.rate.toFixed(2)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editingRowData.tax ?? line.tax}
                              onChange={(e) =>
                                setEditingRowData((prev) => {
                                  const nextDraft = {
                                    ...prev,
                                    tax: Number(e.target.value),
                                    taxInputMode: 'tax',
                                  };
                                  const snapshot = getEditableLineSnapshot(line, nextDraft);
                                  return {
                                    ...nextDraft,
                                    tax: snapshot.tax,
                                    taxAmount: snapshot.taxAmount,
                                    taxInputMode: 'tax',
                                  };
                                })
                              }
                              sx={{ width: 90 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          ) : (
                            Number(line.tax || 0).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editingRowData.taxAmount ?? Number(line.taxAmount || 0).toFixed(2)}
                              onChange={(e) =>
                                setEditingRowData((prev) => {
                                  const nextDraft = {
                                    ...prev,
                                    taxAmount: Number(e.target.value),
                                    taxInputMode: 'taxAmount',
                                  };
                                  const snapshot = getEditableLineSnapshot(line, nextDraft);
                                  return {
                                    ...nextDraft,
                                    tax: snapshot.tax,
                                    taxAmount: snapshot.taxAmount,
                                    taxInputMode: 'taxAmount',
                                  };
                                })
                              }
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          ) : (
                            Number(line.taxAmount || 0).toFixed(2)
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {(isEditing ? draftSnapshot?.amount ?? line.amount : line.amount).toFixed(2)}
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: isEditing ? '#ffe0b2' : 'inherit', border: '1px solid #ccc' }}>
                          {isEditing ? (
                            <>
                              <IconButton
                                size="small"
                                sx={{ color: '#4caf50', mr: 0.5 }}
                                onClick={() => saveEditLine(line.lineId)}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                sx={{ color: '#f44336' }}
                                onClick={cancelEditLine}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton
                                size="small"
                                sx={{ color: ORANGE, mr: 0.5 }}
                                onClick={() => startEditLine(line)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => removeItem(line.lineId)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Paper
          elevation={3}
          sx={{
            width: 320,
            flexShrink: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: `1px solid ${GRID_BORDER}`,
            overflowY: 'auto'
          }}
        >
          <Box sx={{ p: 1, bgcolor: GRID_BLUE, color: '#fff' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>BILL SUMMARY</Typography>
          </Box>
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField label="Bill Date" type="date" size="small" fullWidth value={billDate} onChange={e => setBillDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Divider />
            {/* Editable numeric fields without spinner arrows */}
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Taxable</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={manualTaxable}
                  onChange={e => setManualTaxable(e.target.value)}
                  placeholder={totals.taxableAmount.toFixed(2)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Tax Amount</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={manualTaxAmount}
                  onChange={e => setManualTaxAmount(e.target.value)}
                  placeholder={totals.tax.toFixed(2)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Service Charge</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={manualServiceCharge}
                  onChange={e => setManualServiceCharge(e.target.value)}
                  placeholder={totals.surcharge.toFixed(2)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Divider />
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}><Typography variant="body2">Cash Disc %</Typography></Grid>
              <Grid item xs={6}>
                <TextField size="small" type="number" value={cashDiscountPercent} onChange={e => setCashDiscountPercent(e.target.value)} sx={{ '& input': { py: 0.5, textAlign: 'right' } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}><Typography variant="body2">Freight</Typography></Grid>
              <Grid item xs={6}>
                <TextField size="small" type="number" value={freightCharge} onChange={e => setFreightCharge(e.target.value)} sx={{ '& input': { py: 0.5, textAlign: 'right' } }} />
              </Grid>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}><Typography variant="body2">Packing</Typography></Grid>
              <Grid item xs={6}>
                <TextField size="small" type="number" value={packingCharge} onChange={e => setPackingCharge(e.target.value)} sx={{ '& input': { py: 0.5, textAlign: 'right' } }} />
              </Grid>
            </Grid>
            <Divider />
            <Grid container spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Round Off
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={manualRoundOff}
                  onChange={e => setManualRoundOff(e.target.value)}
                  placeholder={totals.roundOff.toFixed(2)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Divider />
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Packing Charge</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={packingCharge}
                  onChange={e => setPackingCharge(e.target.value)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Surcharge (Incl)</Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  type="number"
                  value={manualSurchargeIncl}
                  onChange={e => setManualSurchargeIncl(e.target.value)}
                  placeholder={totals.taxInclusive.toFixed(2)}
                  sx={{
                    '& input': { py: 0.5, textAlign: 'right' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ flexShrink: 0 }}>
        <Paper
          square
          elevation={4}
          sx={{
            bgcolor: '#212121',
            color: '#fff',
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>NET PAYABLE AMOUNT</Typography>
            <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1, color: '#4caf50' }}>
              ₹{totals.net.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={clearBill}
              disabled={isSavingBill}
              startIcon={<RestartAlt />}
              sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' }, px: 3, fontSize: '1rem' }}
            >
              CLEAR (F12)
            </Button>
            <Button
              variant="contained"
              color="warning"
              size="large"
              onClick={() => saveBill(true)}
              disabled={isSavingBill}
              startIcon={<Pause />}
            >
              Hold (F10)
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={() => saveBill(false)}
              startIcon={<Save />}
              disabled={isSavingBill}
              sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, px: 5, fontSize: '1.2rem' }}
            >
              SAVE BILL (F9)
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  const renderHistoryTab = () => (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 1.5, mb: 1, border: `2px solid ${ORANGE}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              Sales Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your fabric sales and orders
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setTabValue(0)}>
            New Sale Entry
          </Button>
        </Box>

        <Grid container spacing={1} sx={{ mb: 1 }}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.2, border: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">Total Revenue</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>₹{historyStats.totalRevenue.toFixed(2)}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.2, border: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">Completed Sales</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{historyStats.completedSales}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.2, border: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">Pending Sales</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{historyStats.pendingSales}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 1.2, border: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">Total Customers</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{historyStats.uniqueCustomers}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={1}>
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Search by customer, invoice, or fabric..."
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={historyStatus} label="Status" onChange={(e) => setHistoryStatus(e.target.value)}>
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
                <MenuItem value="REFUND_PENDING">Refund Pending</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Platform</InputLabel>
              <Select value={historySource} label="Platform" onChange={(e) => setHistorySource(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="MANUAL">Manual Billing</MenuItem>
                <MenuItem value="DOMESTIC">Domestic Billing</MenuItem>
                <MenuItem value="WEBSITE">Website</MenuItem>
                <MenuItem value="AMAZON">Amazon</MenuItem>
                <MenuItem value="FLIPKART">Flipkart</MenuItem>
                <MenuItem value="MEESHO">Meesho</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 1, flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${ORANGE}` }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell align="right">Total Meters</TableCell>
                <TableCell align="right">Net Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No sales found</TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>{bill.invoiceNo}</TableCell>
                    <TableCell>{bill.billType === 'SALES_RETURN' ? 'Sales Return' : 'Sales'}</TableCell>
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell align="right">{Number(bill.totalMeters ?? bill.totalItems ?? 0).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(bill.netAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={bill.paymentStatus}
                        color={
                          bill.paymentStatus === 'COMPLETED'
                            ? 'success'
                            : bill.paymentStatus === 'PENDING'
                              ? 'warning'
                              : bill.paymentStatus === 'REFUND_PENDING'
                                ? 'warning'
                                : bill.paymentStatus === 'REFUNDED'
                                  ? 'info'
                                  : 'error'
                        }
                      />
                    </TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{bill.source}</TableCell>
                    <TableCell>
                      <IconButton size="small" title="Edit" onClick={() => editSalesBill(bill)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Print PDF" onClick={() => generateSalePdf(bill, 'print')}>
                        <Print fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Download PDF" onClick={() => generateSalePdf(bill, 'download')}>
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          alert(
                            `Invoice: ${bill.invoiceNo}\nCustomer: ${bill.customerName}\nMeters: ${Number(
                              bill.totalMeters ?? bill.totalItems ?? 0
                            ).toFixed(2)}\nAmount: ₹${Number(
                              bill.netAmount || 0
                            ).toFixed(2)}`
                          )
                        }
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {bill.paymentStatus === 'REFUND_PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            const confirmed = window.confirm(`Complete refund for ${bill.invoiceNo}?`);
                            if (confirmed) {
                              const updatedHistory = salesHistory.map(b =>
                                b.id === bill.id ? { ...b, paymentStatus: 'REFUNDED' } : b
                              );
                              setSalesHistory(updatedHistory);
                              alert('Refund completed successfully');
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
    </Box>
  );

  const renderHoldTab = () => (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Paper sx={{ p: 1.5, mb: 1, border: `2px solid ${ORANGE}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              Sales Hold
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Re-open and continue held sales bills
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setTabValue(0)}>
            New Sale Entry
          </Button>
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Search by customer, invoice, or fabric..."
              value={historyQuery}
              onChange={(e) => setHistoryQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={historyStatus} label="Status" onChange={(e) => setHistoryStatus(e.target.value)}>
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="PARTIAL">Partial</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={historyDateFrom}
              onChange={(e) => setHistoryDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={historyDateTo}
              onChange={(e) => setHistoryDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Platform</InputLabel>
              <Select value={historySource} label="Platform" onChange={(e) => setHistorySource(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="MANUAL">Manual Billing</MenuItem>
                <MenuItem value="DOMESTIC">Domestic Billing</MenuItem>
                <MenuItem value="WEBSITE">Website</MenuItem>
                <MenuItem value="AMAZON">Amazon</MenuItem>
                <MenuItem value="FLIPKART">Flipkart</MenuItem>
                <MenuItem value="MEESHO">Meesho</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 1, flex: 1, minHeight: 0, overflow: 'auto', border: `1px solid ${ORANGE}` }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Products</TableCell>
                <TableCell align="right">Total Meters</TableCell>
                <TableCell align="right">Net Amount</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHoldHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hold bills found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHoldHistory.map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>{bill.invoiceNo}</TableCell>
                    <TableCell>{bill.customerName || 'Cash Customer'}</TableCell>
                    <TableCell>{(bill.items || []).slice(0, 2).map((line) => line.name).join(', ') || '-'}</TableCell>
                    <TableCell align="right">{Number(bill.totalMeters ?? bill.totalItems ?? 0).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{Number(bill.netAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip size="small" color="warning" label={bill.paymentStatus || 'PENDING'} />
                    </TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{bill.source || 'MANUAL'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          onClick={() => openHoldBill(bill)}
                        >
                          Open Bill
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => deleteHoldBill(bill)}
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
    </Box>
  );

  const renderSalesReturnTab = () => (
    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {returnError && (
        <Alert severity="error" sx={{ mb: 1 }} onClose={() => setReturnError('')}>
          {returnError}
        </Alert>
      )}
      <Paper sx={{ p: 1.5, mb: 1, border: `2px solid ${ORANGE}` }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 1 }}>
          Sales Return
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Invoice No"
              value={returnInvoiceNo}
              onChange={(e) => setReturnInvoiceNo(e.target.value.toUpperCase())}
              placeholder="Enter invoice number"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" onClick={retrieveReturnInvoice}>
              Retrieve Invoice
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth onClick={processSalesReturn} disabled={!returnInvoiceData}>
              Process Selected Returns
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {returnInvoiceData && (
        <Paper sx={{ p: 1, mb: 1, border: `1px solid ${ORANGE}` }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Invoice Details
          </Typography>
          <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><b>Invoice:</b> {returnInvoiceData.invoiceNo}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><b>Date:</b> {new Date(returnInvoiceData.createdAt).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><b>Meters:</b> {Number(returnInvoiceData.totalMeters ?? 0).toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2"><b>Amount:</b> ₹{Number(returnInvoiceData.netAmount || 0).toFixed(2)}</Typography>
            </Grid>
          </Grid>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell align="right">Meters Sold</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Return Qty</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(returnInvoiceData.items || []).map((line, idx) => (
                  <TableRow key={`${line.id || line.code}-${idx}`}>
                    <TableCell>{line.name}</TableCell>
                    <TableCell>{line.code}</TableCell>
                    <TableCell align="right">{Number(line.qty || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">{Number(line.rate || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <TextField
                        size="small"
                        type="number"
                        placeholder="0"
                        value={returnQuantities[line.id || line.code] || ''}
                        onChange={(e) => {
                          setReturnQuantities(prev => ({
                            ...prev,
                            [line.id || line.code]: e.target.value
                          }));
                        }}
                        inputProps={{ min: 0, max: Number(line.qty || 0), step: 0.1 }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      <Paper sx={{ p: 1, border: `1px solid ${ORANGE}` }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Note: Return entries are stored as separate transactions. Original sales invoices are not deleted.
        </Typography>
      </Paper>
    </Box>
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (tabValue === 0) saveBill(false);
      }
      if (e.key === 'F10') {
        e.preventDefault();
        if (tabValue === 0) saveBill(true);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        if (tabValue === 0) clearBill();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearBill, saveBill, tabValue]);

  return (
    <Box
      sx={{
        flex: 1,               // Fill available layout space under navbar
        minHeight: 0,          // Allow internal areas to manage their own scroll
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#f5f5f5',    // Background color
        m: 0,                  // RESET: No margin
        p: 0                   // RESET: No padding
      }}
    >
      {/* Global Tabs - Made flush with content */}
      <Paper
        square
        elevation={0} // Remove shadow to prevent visual gaps
        sx={{
          zIndex: 10,
          borderBottom: '1px solid #e0e0e0', // Add a subtle separator line instead of shadow
          flexShrink: 0  // Prevent tabs from shrinking
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="secondary"
          indicatorColor="secondary"
          sx={{ minHeight: 48 }}
        >
          <Tab label="POS Billing" icon={<PointOfSale fontSize="small" />} iconPosition="start" />
          <Tab label="Sales History" icon={<Visibility fontSize="small" />} iconPosition="start" />
          <Tab label="Sales Hold" icon={<Pause fontSize="small" />} iconPosition="start" />
          <Tab label="Returns" icon={<RestartAlt fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Content Area - Flex 1 ensures it fills the remaining space */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tabValue === 0 && renderBillingTab()}
        {tabValue === 1 && renderHistoryTab()}
        {tabValue === 2 && renderHoldTab()}
        {tabValue === 3 && renderSalesReturnTab()}
      </Box>

      {/* New Customer Dialog */}
      <Dialog open={newCustomerDialog} onClose={() => setNewCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Customer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Code"
                value={newCustomerForm.customer_code}
                onChange={(e) => setNewCustomerForm(p => ({ ...p, customer_code: e.target.value.toUpperCase() }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={newCustomerForm.customer_name}
                onChange={(e) => setNewCustomerForm(p => ({ ...p, customer_name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mobile"
                value={newCustomerForm.mobile}
                onChange={(e) => setNewCustomerForm(p => ({ ...p, mobile: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm(p => ({ ...p, address: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCustomerDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createNewCustomer} sx={{ bgcolor: ORANGE, '&:hover': { bgcolor: '#e68900' } }}>
            Create Customer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POS;
