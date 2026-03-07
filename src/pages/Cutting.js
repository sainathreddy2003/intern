import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useQueryClient } from 'react-query';
import Add from '@mui/icons-material/Add';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ContentCut from '@mui/icons-material/ContentCut';
import Pending from '@mui/icons-material/Pending';
import Search from '@mui/icons-material/Search';
import { toast } from 'react-hot-toast';
import { inventoryAPI, itemsAPI } from '../services/api';

const SUBDIVISION_PRESETS = [1, 3, 5, 10];

const createDefaultSubdivisions = (sendingMeters) => {
  return SUBDIVISION_PRESETS.map((preset) => ({
    id: preset,
    subdivision: `${preset} Meter`,
    units: '',
    totalMeters: 0,
  }));
};

const emptyEntry = {
  sendingMeters: '',
  sentTo: '',
  subdivisions: createDefaultSubdivisions(0),
};

const emptyReceiveForm = {};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFixed2 = (value) => Number(toNumber(value).toFixed(2));

const resolveItemStock = (item = {}) => {
  if (!item || typeof item !== 'object') return 0;
  const candidates = [
    item.current_stock,
    item.stock,
    item.quantity,
    item.available_stock,
    item.availableStock
  ];
  for (const value of candidates) {
    const parsed = toNumber(value);
    if (parsed > 0) return parsed;
  }
  return toNumber(item.current_stock ?? item.stock ?? item.quantity ?? 0);
};

const getSubdivisionCount = (entry) => {
  return (entry.subdivisions || []).length;
};

const createSubdivisionRows = (subdivisions) => {
  return subdivisions.map((sub) => ({
    id: sub.id,
    subdivision: sub.subdivision,
    units: toFixed2(sub.units),
    totalMeters: sub.totalMeters,
  }));
};

const Cutting = () => {
  const queryClient = useQueryClient();
  const [barcode, setBarcode] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [entry, setEntry] = useState(emptyEntry);
  const [cuttingJobs, setCuttingJobs] = useState([]);

  const [receiveDialog, setReceiveDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [receiveRows, setReceiveRows] = useState([]);
  const [receiveForm, setReceiveForm] = useState(emptyReceiveForm);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cuttingJobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCuttingJobs(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setCuttingJobs([]);
    }
  }, []);

  const saveCuttingJobs = (jobs) => {
    setCuttingJobs(jobs);
    localStorage.setItem('cuttingJobs', JSON.stringify(jobs));
  };

  const totalAvailableMeters = useMemo(() => toFixed2(resolveItemStock(selectedItem)), [selectedItem]);

  const sendingMeters = useMemo(() => toFixed2(entry.sendingMeters), [entry.sendingMeters]);

  const sendingSummary = useMemo(() => {
    const subdivisions = entry.subdivisions || [];
    const totalMeters = subdivisions.reduce((sum, sub) => sum + toFixed2(sub.totalMeters), 0);
    const totalUnits = subdivisions.reduce((sum, sub) => sum + toFixed2(sub.units), 0);
    const diff = toFixed2(sendingMeters - totalMeters);
    return {
      totalMeters,
      totalUnits,
      diff,
      isOverUsed: totalMeters > sendingMeters,
      isUnderUsed: totalMeters < sendingMeters,
      isMatched: Math.abs(diff) < 0.01,
    };
  }, [entry.subdivisions, sendingMeters]);

  const receiveSummary = useMemo(() => {
    const rows = Array.isArray(receiveRows) ? receiveRows : [];
    const sending = toFixed2(selectedJob?.sendingMeters ?? 0);
    const totalMeters = toFixed2(rows.reduce((sum, row) => sum + toNumber(row.totalMeters), 0));
    
    const grandTotal = toFixed2(rows.reduce((sum, row) => {
      const units = toFixed2(row.units);
      const sellingPrice = toFixed2(row.sellingPrice);
      return sum + (units * sellingPrice);
    }, 0));

    return {
      sending,
      totalMeters,
      isOverUsed: totalMeters > sending,
      isUnderUsed: totalMeters < sending,
      grandTotal,
    };
  }, [receiveRows, selectedJob]);

  const handleBarcodeSearch = async () => {
    const code = String(barcode || '').trim();
    if (!code) {
      toast.error('Enter barcode');
      return;
    }

    try {
      const response = await itemsAPI.getItemByBarcode(code);
      let item = response?.data;
      if (!item) {
        toast.error('Item not found');
        return;
      }

      // Pull latest inventory snapshot so Cutting reflects current meters.
      try {
        const stockRes = await inventoryAPI.getStock({ q: item.item_code || code, limit: 50 });
        const stockList = Array.isArray(stockRes?.data?.items) ? stockRes.data.items : [];
        const byId = stockList.find((x) => String(x.item_id || x.id || x._id) === String(item.item_id || item.id || item._id));
        const byCode = stockList.find((x) => String(x.item_code || '').toUpperCase() === String(item.item_code || '').toUpperCase());
        const freshest = byId || byCode;
        if (freshest) {
          item = { ...item, ...freshest };
        }
      } catch {
        // Non-blocking fallback: keep item from barcode lookup.
      }

      setSelectedItem(item);
      setEntry(emptyEntry);
      toast.success(`Item loaded: ${item.item_name}`);
    } catch {
      toast.error('Item not found');
      setSelectedItem(null);
    }
  };

  const updateSubdivisionUnits = (index, units) => {
    setEntry((prev) => {
      const subdivisions = [...prev.subdivisions];
      const sub = { ...subdivisions[index] };
      const unitsNum = units === '' ? 0 : toFixed2(units);
      const meterValue = sub.id;
      sub.units = units === '' ? '' : String(unitsNum);
      sub.totalMeters = toFixed2(unitsNum * meterValue);
      subdivisions[index] = sub;
      return { ...prev, subdivisions };
    });
  };

  const updateReceiveRowPricing = (rowIndex, field, value) => {
    setReceiveRows((prev) => {
      const rows = [...prev];
      const row = { ...rows[rowIndex] };
      row[field] = value;
      
      const costPerPiece = toFixed2(row.costPerPiece);
      const serviceCharge = toFixed2(row.serviceCharge);
      const netAmountPerPiece = toFixed2(costPerPiece + serviceCharge);
      let roiPercent = toFixed2(row.roiPercent);
      let sellingPrice = toFixed2(row.sellingPrice);

      if (field === 'sellingPrice') {
        roiPercent =
          netAmountPerPiece > 0
            ? toFixed2(((sellingPrice - netAmountPerPiece) / netAmountPerPiece) * 100)
            : 0;
      } else {
        sellingPrice = netAmountPerPiece > 0 ? toFixed2(netAmountPerPiece * (1 + roiPercent / 100)) : 0;
      }
      
      row.netAmountPerPiece = netAmountPerPiece;
      row.roiPercent = String(roiPercent);
      row.sellingPrice = sellingPrice;
      
      rows[rowIndex] = row;
      return rows;
    });
  };

  const addCustomSubdivision = () => {
    const customMeter = prompt('Enter meter value for custom subdivision:');
    if (!customMeter) return;
    const meterValue = toFixed2(customMeter);
    if (meterValue <= 0) {
      toast.error('Meter value must be greater than 0');
      return;
    }
    setEntry((prev) => {
      const newSub = {
        id: meterValue,
        subdivision: `${meterValue} Meter`,
        units: '',
        totalMeters: 0,
      };
      return { ...prev, subdivisions: [...prev.subdivisions, newSub] };
    });
  };

  const clearEntry = () => {
    setEntry({
      sendingMeters: '',
      sentTo: '',
      subdivisions: createDefaultSubdivisions(0),
    });
  };

  const sendForCutting = async () => {
    if (!selectedItem) {
      toast.error('Select an item first');
      return;
    }

    const sending = toFixed2(entry.sendingMeters);
    if (sending <= 0) {
      toast.error('Sending Meters must be greater than 0');
      return;
    }

    if (sending > totalAvailableMeters) {
      toast.error(`Sending Meters cannot exceed available meters (${totalAvailableMeters})`);
      return;
    }

    if (sendingSummary.totalMeters <= 0) {
      toast.error('Enter units in at least one subdivision');
      return;
    }

    if (!sendingSummary.isMatched) {
      const ok = window.confirm(
        `Total meters (${sendingSummary.totalMeters}) does not match Sending Meters (${sendingMeters}). Continue?`
      );
      if (!ok) return;
    }

    const subdivisionCount = getSubdivisionCount(entry);
    const sourceSellingPrice = toFixed2(
      selectedItem?.selling_price ?? selectedItem?.sale_price ?? 0
    );
    const sourceNetCost = toFixed2(selectedItem?.net_cost ?? selectedItem?.purchase_price ?? 0);
    const sourceRoiPercent =
      sourceNetCost > 0
        ? toFixed2(((sourceSellingPrice - sourceNetCost) / sourceNetCost) * 100)
        : toFixed2(selectedItem?.roi_percent ?? 0);
    const job = {
      id: `CUT-${Date.now()}`,
      itemId: selectedItem.item_id || selectedItem.id || '',
      itemName: selectedItem.item_name || '',
      itemBarcode: selectedItem.barcode || '',
      itemCode: selectedItem.item_code || '',
      totalAvailableMeters,
      sendingMeters: sending,
      sentTo: String(entry.sentTo || '').trim(),
      subdivisionCount,
      rows: createSubdivisionRows(entry.subdivisions),
      currentSellingPrice: sourceSellingPrice,
      currentRoiPercent: sourceRoiPercent,
      usedTotal: sendingSummary.totalMeters,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    try {
      await inventoryAPI.adjustStock({
        itemId: selectedItem.item_id || selectedItem.id,
        quantity: -sending,
      });
      queryClient.invalidateQueries('items-stock');
      queryClient.invalidateQueries('low-stock-items');
      queryClient.invalidateQueries('expiring-items');
    } catch {
      // Offline/demo fallback, still keep job history.
    }

    saveCuttingJobs([job, ...cuttingJobs]);
    setSelectedItem(null);
    setBarcode('');
    clearEntry();
    toast.success('Cutting details saved and stock reduced');
  };

  const openReceiveDialog = (job) => {
    setSelectedJob(job);
    const jobRows = Array.isArray(job?.rows) ? job.rows : [];
    // Only show rows that have units > 0
    const filteredRows = jobRows.filter(row => toNumber(row.units) > 0);
    
    // Calculate cost per piece based on sending meters and subdivision
    const sendingMeters = toFixed2(job?.sendingMeters ?? 0);
    const totalUnits = filteredRows.reduce((sum, row) => sum + toNumber(row.units), 0);
    
    setReceiveRows(
      filteredRows.map((row) => {
        const units = toFixed2(row.units);
        const meterValue = row.id; // subdivision meter value (1, 3, 5, 10)
        const totalMetersForRow = toFixed2(row.totalMeters);
        
        // Calculate cost per piece: (sendingMeters / totalUnits) OR use existing if already set
        const calculatedCostPerPiece = units > 0 ? toFixed2(sendingMeters / totalUnits) : 0;
        const costPerPiece = toFixed2(row.costPerPiece ?? calculatedCostPerPiece);
        const serviceCharge = toFixed2(row.serviceCharge ?? 0);
        const netAmountPerPiece = toFixed2(costPerPiece + serviceCharge);
        const roiPercent = toFixed2(row.roiPercent ?? 0);
        const sellingPrice = netAmountPerPiece > 0 ? toFixed2(netAmountPerPiece * (1 + roiPercent / 100)) : 0;
        const currentSellingPrice = toFixed2(
          row.currentSellingPrice ?? job?.currentSellingPrice ?? row.sellingPrice ?? sellingPrice
        );
        const currentRoiPercent = toFixed2(
          row.currentRoiPercent ??
          job?.currentRoiPercent ??
          (netAmountPerPiece > 0 ? ((currentSellingPrice - netAmountPerPiece) / netAmountPerPiece) * 100 : (row.roiPercent ?? 0))
        );
        
        return {
          ...row,
          units: String(units),
          totalMeters: totalMetersForRow,
          costPerPiece: String(costPerPiece),
          serviceCharge: String(serviceCharge),
          netAmountPerPiece,
          roiPercent: String(roiPercent),
          sellingPrice,
          currentRoiPercent,
          currentSellingPrice,
        };
      })
    );
    setReceiveForm({
      costPerRoll: String(toFixed2(job?.receipt?.costPerRoll ?? 0)),
      costPerMeter:
        job?.receipt?.costPerMeter === undefined || job?.receipt?.costPerMeter === null
          ? ''
          : String(toFixed2(job.receipt.costPerMeter)),
      sellingPricePerUnit: String(toFixed2(job?.receipt?.sellingPricePerUnit ?? 0)),
    });
    setReceiveDialog(true);
  };

  const closeReceiveDialog = () => {
    setReceiveDialog(false);
    setSelectedJob(null);
    setReceiveRows([]);
    setReceiveForm(emptyReceiveForm);
  };

  const receiveAndSave = async () => {
    if (!selectedJob) return;

    if (receiveSummary.totalMeters <= 0) {
      toast.error('Total meters must be greater than 0');
      return;
    }

    if (receiveSummary.isUnderUsed || receiveSummary.isOverUsed) {
      const ok = window.confirm(
        `Total meters (${receiveSummary.totalMeters}) does not match Sending Meters (${receiveSummary.sending}). Continue?`
      );
      if (!ok) return;
    }

    for (const row of receiveRows) {
      const unitsQty = toFixed2(row.units);
      if (unitsQty <= 0) continue;

      const costPerPiece = toFixed2(row.costPerPiece);
      const serviceCharge = toFixed2(row.serviceCharge);
      const netAmountPerPiece = toFixed2(row.netAmountPerPiece);
      const sellingPrice = toFixed2(row.sellingPrice);

      const newItemCode = `${selectedJob.itemCode}-${row.id}M`;
      const newBarcode = `${selectedJob.itemBarcode}-${row.id}M`;

      let existingItem = null;
      try {
        const response = await itemsAPI.getItemByBarcode(newBarcode);
        existingItem = response?.data || null;
      } catch {
        existingItem = null;
      }

      if (existingItem?.item_id) {
        try {
          await inventoryAPI.adjustStock({
            itemId: existingItem.item_id,
            quantity: unitsQty,
          });
          queryClient.invalidateQueries('items-stock');
          queryClient.invalidateQueries('low-stock-items');
          queryClient.invalidateQueries('expiring-items');
        } catch {
          // Keep process resilient in offline mode.
        }
      } else {
        const payload = {
          item_name: `${selectedJob.itemName} (${row.subdivision})`,
          item_code: newItemCode,
          barcode: newBarcode,
          stock: unitsQty,
          current_stock: unitsQty,
          unit_name: 'UNIT',
          selling_price: sellingPrice,
          sale_price: sellingPrice,
          purchase_price: costPerPiece,
          service_charge: serviceCharge,
          net_cost: netAmountPerPiece,
          roi_percent: toFixed2(row.roiPercent),
          description: `Cut piece from ${selectedJob.itemName} - ${row.subdivision}`,
          group: selectedJob.itemName,
          item_type: 'FABRIC',
        };
        try {
          await itemsAPI.createItem(payload);
          queryClient.invalidateQueries('items-stock');
          queryClient.invalidateQueries('low-stock-items');
          queryClient.invalidateQueries('expiring-items');
        } catch {
          // Keep process resilient in offline mode.
        }
      }
    }

    const updatedJobs = cuttingJobs.map((job) => {
      if (job.id !== selectedJob.id) return job;
      return {
        ...job,
        status: 'RECEIVED',
        receivedAt: new Date().toISOString(),
        rows: receiveRows.map((row) => ({
          id: row.id,
          subdivision: row.subdivision,
          units: toFixed2(row.units),
          totalMeters: toFixed2(row.totalMeters),
          costPerPiece: toFixed2(row.costPerPiece),
          serviceCharge: toFixed2(row.serviceCharge),
          netAmountPerPiece: toFixed2(row.netAmountPerPiece),
          currentRoiPercent: toFixed2(row.currentRoiPercent),
          currentSellingPrice: toFixed2(row.currentSellingPrice),
          roiPercent: toFixed2(row.roiPercent),
          sellingPrice: toFixed2(row.sellingPrice),
        })),
        usedTotal: receiveSummary.totalMeters,
        receipt: {
          grandTotal: receiveSummary.grandTotal,
        },
      };
    });

    saveCuttingJobs(updatedJobs);
    closeReceiveDialog();
    toast.success('Receive details saved successfully');
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2, border: '1px solid #ffcc80' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ContentCut sx={{ color: '#f57c00' }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Cutting Entry
          </Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, border: '1px solid #ffcc80' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={10}>
            <TextField
              fullWidth
              label="Barcode"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleBarcodeSearch();
                }
              }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={handleBarcodeSearch}>
                    <Search />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button fullWidth variant="contained" sx={{ height: 56 }} onClick={handleBarcodeSearch}>
              Search
            </Button>
          </Grid>
        </Grid>
        {selectedItem && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>{selectedItem.item_name}</strong> ({selectedItem.item_code}) | Available Stock:{' '}
            {totalAvailableMeters} meters
          </Alert>
        )}
      </Paper>

      {selectedItem && (
        <Paper sx={{ p: 2, mb: 2, border: '1px solid #ffcc80' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            Cutting Entry
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Total Available Meters"
                value={totalAvailableMeters}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Sending Meters *"
                value={entry.sendingMeters}
                onChange={(event) => setEntry((prev) => ({ ...prev, sendingMeters: event.target.value }))}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sent To"
                value={entry.sentTo}
                onChange={(event) => setEntry((prev) => ({ ...prev, sentTo: event.target.value }))}
                placeholder="Person / Unit name (optional)"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Subdivisions
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Subdivision</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Units</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Total Meters</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entry.subdivisions.map((sub, index) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.subdivision}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            fullWidth
                            type="number"
                            value={sub.units}
                            onChange={(event) => updateSubdivisionUnits(index, event.target.value)}
                            inputProps={{ min: 0, step: '1' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{toFixed2(sub.totalMeters)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addCustomSubdivision}
                sx={{ mt: 1 }}
              >
                Add Custom Subdivision
              </Button>
            </Box>

            <Box sx={{ width: 300 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
                Summary
              </Typography>
              <Card variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Sending Meters
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {toFixed2(sendingMeters)}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Units
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {toFixed2(sendingSummary.totalUnits)}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Total Meters
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: sendingSummary.isMatched ? 'success.main' : 'warning.main' }}>
                    {toFixed2(sendingSummary.totalMeters)}
                  </Typography>
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ bgcolor: sendingSummary.isMatched ? '#e8f5e9' : sendingSummary.diff < 0 ? '#ffebee' : '#fff3e0' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Difference
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: sendingSummary.isMatched ? 'success.main' : sendingSummary.diff < 0 ? 'error.main' : 'warning.main' }}>
                    {toFixed2(sendingSummary.diff)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {!sendingSummary.isMatched && sendingSummary.totalMeters > 0 && (
            <Alert severity={sendingSummary.isOverUsed ? 'error' : 'warning'} sx={{ mt: 2 }}>
              {sendingSummary.isOverUsed
                ? `Total meters (${sendingSummary.totalMeters}) exceeds Sending Meters (${sendingMeters})`
                : `Total meters (${sendingSummary.totalMeters}) is less than Sending Meters (${sendingMeters})`}
            </Alert>
          )}

          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={sendForCutting}>
              Save & Send For Cutting
            </Button>
            <Button variant="outlined" onClick={clearEntry}>
              Clear
            </Button>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2, border: '1px solid #ffcc80' }}>
        <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 700 }}>
          Cutting Jobs
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Job</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Sent To</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Sending</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Used</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cuttingJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No jobs created yet
                  </TableCell>
                </TableRow>
              ) : (
                cuttingJobs.map((job) => (
                  <TableRow key={job.id} hover>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.itemName}</TableCell>
                    <TableCell>{job.sentTo}</TableCell>
                    <TableCell>{toFixed2(job.sendingMeters ?? job.sendingRolls ?? 0)}</TableCell>
                    <TableCell>{toFixed2(job.usedTotal)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        icon={job.status === 'RECEIVED' ? <CheckCircle /> : <Pending />}
                        color={job.status === 'RECEIVED' ? 'success' : 'warning'}
                        label={job.status}
                      />
                    </TableCell>
                    <TableCell>
                      {job.status === 'PENDING' ? (
                        <Button size="small" variant="contained" onClick={() => openReceiveDialog(job)}>
                          Receive
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" onClick={() => openReceiveDialog(job)}>
                          View
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

      <Dialog
        open={receiveDialog}
        onClose={closeReceiveDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{ sx: { minHeight: '80vh' } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Receive Cut Pieces</DialogTitle>
        <DialogContent dividers>
          {selectedJob && (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption">Item</Typography>
                      <Typography variant="h6">{selectedJob.itemName}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption">Sent To</Typography>
                      <Typography variant="h6">{selectedJob.sentTo}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption">Sending Meters</Typography>
                      <Typography variant="h6">{toFixed2(selectedJob.sendingMeters)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption">Subdivisions</Typography>
                      <Typography variant="h6">{selectedJob.subdivisionCount}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
                Pricing Details
              </Typography>
              <TableContainer sx={{ mb: 2, maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Subdivision</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Units</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Cost/Piece</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Service Charge</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Net Amount/Piece</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Current ROI %</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Current Selling</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>ROI %</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Selling Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receiveRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.subdivision}</TableCell>
                        <TableCell>{toFixed2(row.units)}</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            fullWidth
                            type="number"
                            value={row.costPerPiece}
                            InputProps={{ readOnly: true }}
                            inputProps={{ min: 0, step: '0.01' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            fullWidth
                            type="number"
                            value={row.serviceCharge}
                            onChange={(event) => updateReceiveRowPricing(index, 'serviceCharge', event.target.value)}
                            inputProps={{ min: 0, step: '0.01' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{toFixed2(row.netAmountPerPiece)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{toFixed2(row.currentRoiPercent)}%</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>
                          {toFixed2(row.currentSellingPrice)}
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TextField
                            fullWidth
                            type="number"
                            value={row.roiPercent}
                            onChange={(event) => updateReceiveRowPricing(index, 'roiPercent', event.target.value)}
                            inputProps={{ min: 0, step: '0.01' }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 140 }}>
                          <TextField
                            fullWidth
                            type="number"
                            value={row.sellingPrice}
                            onChange={(event) => updateReceiveRowPricing(index, 'sellingPrice', event.target.value)}
                            inputProps={{ min: 0, step: '0.01' }}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {receiveSummary.isOverUsed && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Total meters ({receiveSummary.totalMeters}) exceeds Sending Meters ({receiveSummary.sending})
                </Alert>
              )}
              {!receiveSummary.isOverUsed && receiveSummary.isUnderUsed && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Total meters ({receiveSummary.totalMeters}) is less than Sending Meters ({receiveSummary.sending})
                </Alert>
              )}

              <Paper
                sx={{
                  p: 2,
                  border: '2px solid #f57c00',
                  bgcolor: '#fff3e0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Grand Total
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#e65100' }}>
                  {receiveSummary.grandTotal.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeReceiveDialog}>Cancel</Button>
          {selectedJob?.status !== 'RECEIVED' && (
            <Button variant="contained" onClick={receiveAndSave}>
              Save Receive Details
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cutting;
