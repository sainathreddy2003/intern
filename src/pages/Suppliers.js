import React, { useMemo, useState } from 'react';
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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Business from '@mui/icons-material/Business';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { suppliersAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const emptyForm = {
  supplier_code: '',
  supplier_name: '',
  mobile: '',
  email: '',
  address: '',
  gst_no: '',
  supplying_fabric: '',
  supply_quantity: '',
};

const Suppliers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery(
    ['suppliers', search],
    () => suppliersAPI.getSuppliers({ q: search, page: 1, limit: 500 }),
    { staleTime: 2 * 60 * 1000 }
  );

  const suppliers = Array.isArray(data?.data) ? data.data : [];

  const createMutation = useMutation((payload) => suppliersAPI.createSupplier(payload), {
    onSuccess: () => {
      toast.success('Supplier added');
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries('suppliers');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to add supplier');
    },
  });

  const updateMutation = useMutation(
    ({ id, payload }) => suppliersAPI.updateSupplier(id, payload),
    {
      onSuccess: () => {
        toast.success('Supplier updated');
        setOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        queryClient.invalidateQueries('suppliers');
      },
      onError: (error) => {
        toast.error(error?.message || 'Failed to update supplier');
      },
    }
  );

  const deleteMutation = useMutation((id) => suppliersAPI.deleteSupplier(id), {
    onSuccess: () => {
      toast.success('Supplier deleted');
      queryClient.invalidateQueries('suppliers');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete supplier');
    },
  });

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((x) => x.is_active !== false).length;
    const withGst = suppliers.filter((x) => String(x.gst_no || '').trim()).length;
    const thisMonth = suppliers.filter((x) => {
      const created = new Date(x.createdAt || 0);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, withGst, thisMonth };
  }, [suppliers]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.supplier_id || row.id);
    setForm({
      supplier_code: row.supplier_code || '',
      supplier_name: row.supplier_name || '',
      mobile: row.mobile || '',
      email: row.email || '',
      address: row.address || '',
      gst_no: row.gst_no || '',
      supplying_fabric: row.supplying_fabric || '',
      supply_quantity: String(row.supply_quantity ?? ''),
    });
    setOpen(true);
  };

  const submit = () => {
    const payload = {
      supplier_code: String(form.supplier_code || '').trim().toUpperCase(),
      supplier_name: String(form.supplier_name || '').trim(),
      mobile: String(form.mobile || '').trim(),
      email: String(form.email || '').trim(),
      address: String(form.address || '').trim(),
      gst_no: String(form.gst_no || '').trim(),
      supplying_fabric: String(form.supplying_fabric || '').trim(),
      supply_quantity: Math.max(0, Number(form.supply_quantity || 0)),
      is_active: true,
    };

    if (!payload.supplier_code || !payload.supplier_name) {
      toast.error('Supplier ID and Supplier Name are required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const handleDelete = (row) => {
    const id = row.supplier_id || row.id;
    if (!id) return;
    if (!window.confirm(`Delete supplier "${row.supplier_name}"?`)) return;
    deleteMutation.mutate(id);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
          Suppliers
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
          Add Supplier
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">Total Suppliers</Typography><Typography variant="h4">{stats.total}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">Active Suppliers</Typography><Typography variant="h4">{stats.active}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">With GST</Typography><Typography variant="h4">{stats.withGst}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">New This Month</Typography><Typography variant="h4">{stats.thisMonth}</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by supplier ID, name, or mobile..."
          InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ mb: 2 }}
        />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Supplier ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Supplying Fabric</TableCell>
                <TableCell align="right">Supply Qty</TableCell>
                <TableCell>GST No</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">Loading suppliers...</TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">No suppliers found</TableCell>
                </TableRow>
              ) : (
                suppliers.map((row) => (
                  <TableRow key={row.supplier_id || row.id} hover>
                    <TableCell>{row.supplier_code}</TableCell>
                    <TableCell>{row.supplier_name}</TableCell>
                    <TableCell>{row.mobile || '-'}</TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.address || '-'}</TableCell>
                    <TableCell>{row.supplying_fabric || '-'}</TableCell>
                    <TableCell align="right">{Number(row.supply_quantity || 0).toFixed(2)}</TableCell>
                    <TableCell>{row.gst_no || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => openEdit(row)}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(row)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier ID *"
                value={form.supplier_code}
                onChange={(e) => setForm((p) => ({ ...p, supplier_code: e.target.value.toUpperCase() }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name *"
                value={form.supplier_name}
                onChange={(e) => setForm((p) => ({ ...p, supplier_name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile"
                value={form.mobile}
                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Supplying Fabric"
                placeholder="e.g. Cotton, Linen, Rayon"
                value={form.supplying_fabric}
                onChange={(e) => setForm((p) => ({ ...p, supplying_fabric: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Supply Quantity"
                value={form.supply_quantity}
                onChange={(e) => setForm((p) => ({ ...p, supply_quantity: e.target.value }))}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GST No"
                value={form.gst_no}
                onChange={(e) => setForm((p) => ({ ...p, gst_no: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={createMutation.isLoading || updateMutation.isLoading}>
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;
