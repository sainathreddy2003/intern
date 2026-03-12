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
  Tabs,
  Tab,
} from '@mui/material';
import People from '@mui/icons-material/People';
import Business from '@mui/icons-material/Business';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { customersAPI, suppliersAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const emptyForm = {
  customer_code: '',
  customer_name: '',
  mobile: '',
  email: '',
  address: '',
  gst_no: '',
  credit_limit: '',
};

const Customers = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery(
    ['customers', search],
    () => customersAPI.getCustomers({ q: search, page: 1, limit: 500 }),
    { staleTime: 2 * 60 * 1000, enabled: tabValue === 0 }
  );

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery(
    ['suppliers', search],
    () => suppliersAPI.getSuppliers({ q: search, page: 1, limit: 500 }),
    { staleTime: 2 * 60 * 1000, enabled: tabValue === 1 }
  );

  const customers = Array.isArray(data?.data) ? data.data : [];
  const suppliers = Array.isArray(suppliersData?.data) ? suppliersData.data : [];

  const createMutation = useMutation((payload) => tabValue === 0 ? customersAPI.createCustomer(payload) : suppliersAPI.createSupplier(payload), {
    onSuccess: () => {
      toast.success(`${tabValue === 0 ? 'Customer' : 'Supplier'} added`);
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries(tabValue === 0 ? 'customers' : 'suppliers');
    },
    onError: (error) => {
      toast.error(error?.message || `Failed to add ${tabValue === 0 ? 'customer' : 'supplier'}`);
    },
  });

  const updateMutation = useMutation(
    ({ id, payload }) => tabValue === 0 ? customersAPI.updateCustomer(id, payload) : suppliersAPI.updateSupplier(id, payload),
    {
      onSuccess: () => {
        toast.success(`${tabValue === 0 ? 'Customer' : 'Supplier'} updated`);
        setOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        queryClient.invalidateQueries(tabValue === 0 ? 'customers' : 'suppliers');
      },
      onError: (error) => {
        toast.error(error?.message || `Failed to update ${tabValue === 0 ? 'customer' : 'supplier'}`);
      },
    }
  );

  const deleteMutation = useMutation((id) => tabValue === 0 ? customersAPI.deleteCustomer(id) : suppliersAPI.deleteSupplier(id), {
    onSuccess: () => {
      toast.success(`${tabValue === 0 ? 'Customer' : 'Supplier'} deleted`);
      queryClient.invalidateQueries(tabValue === 0 ? 'customers' : 'suppliers');
    },
    onError: (error) => {
      toast.error(error?.message || `Failed to delete ${tabValue === 0 ? 'customer' : 'supplier'}`);
    },
  });

  const stats = useMemo(() => {
    const list = tabValue === 0 ? customers : suppliers;
    const total = list.length;
    const active = list.filter((c) => c.is_active !== false).length;
    const withCredit = list.filter((c) => Number(c.credit_limit || 0) > 0).length;
    const thisMonth = list.filter((c) => {
      const created = new Date(c.createdAt || 0);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
    return { total, active, withCredit, thisMonth };
  }, [customers, suppliers, tabValue]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (row) => {
    const id = tabValue === 0 ? (row.customer_id || row.id) : (row.supplier_id || row.id);
    setEditingId(id);
    setForm({
      customer_code: row.customer_code || row.supplier_code || '',
      customer_name: row.customer_name || row.supplier_name || '',
      mobile: row.mobile || '',
      email: row.email || '',
      address: row.address || '',
      gst_no: row.gst_no || '',
      credit_limit: String(row.credit_limit ?? ''),
    });
    setOpen(true);
  };

  const submit = () => {
    const payload = tabValue === 0 ? {
      customer_code: String(form.customer_code || '').trim().toUpperCase(),
      customer_name: String(form.customer_name || '').trim(),
      mobile: String(form.mobile || '').trim(),
      email: String(form.email || '').trim(),
      address: String(form.address || '').trim(),
      gst_no: String(form.gst_no || '').trim(),
      credit_limit: Number(form.credit_limit || 0),
      is_active: true,
    } : {
      supplier_code: String(form.customer_code || '').trim().toUpperCase(),
      supplier_name: String(form.customer_name || '').trim(),
      mobile: String(form.mobile || '').trim(),
      email: String(form.email || '').trim(),
      address: String(form.address || '').trim(),
      gst_no: String(form.gst_no || '').trim(),
      credit_limit: Number(form.credit_limit || 0),
      is_active: true,
    };

    const codeField = tabValue === 0 ? payload.customer_code : payload.supplier_code;
    const nameField = tabValue === 0 ? payload.customer_name : payload.supplier_name;

    if (!codeField || !nameField) {
      toast.error(`${tabValue === 0 ? 'Customer' : 'Supplier'} ID and Name are required`);
      return;
    }

    if (!payload.mobile) {
      toast.error('Mobile number is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const handleDelete = (row) => {
    const id = tabValue === 0 ? (row.customer_id || row.id) : (row.supplier_id || row.id);
    const name = tabValue === 0 ? row.customer_name : row.supplier_name;
    if (!id) return;
    if (!window.confirm(`Delete ${tabValue === 0 ? 'customer' : 'supplier'} "${name}"?`)) return;
    deleteMutation.mutate(id);
  };

  const currentList = tabValue === 0 ? customers : suppliers;
  const currentLoading = tabValue === 0 ? isLoading : suppliersLoading;
  const entityType = tabValue === 0 ? 'Customer' : 'Supplier';

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          Parties
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>
          Add {entityType}
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Customers" icon={<People />} iconPosition="start" />
          <Tab label="Suppliers" icon={<Business />} iconPosition="start" />
        </Tabs>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">Total {entityType}s</Typography><Typography variant="h4">{stats.total}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">Active {entityType}s</Typography><Typography variant="h4">{stats.active}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent><Typography variant="h6">{tabValue === 0 ? 'Credit Customers' : 'With GST'}</Typography><Typography variant="h4">{stats.withCredit}</Typography></CardContent></Card>
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
          placeholder={`Search by ${entityType.toLowerCase()} ID, name, or mobile...`}
          InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ mb: 2 }}
        />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{entityType} ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Address</TableCell>
                {tabValue === 0 && <TableCell align="right">Credit Limit</TableCell>}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentLoading ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 0 ? 7 : 6} align="center">Loading {entityType.toLowerCase()}s...</TableCell>
                </TableRow>
              ) : currentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tabValue === 0 ? 7 : 6} align="center">No {entityType.toLowerCase()}s found</TableCell>
                </TableRow>
              ) : (
                currentList.map((row) => (
                  <TableRow key={(tabValue === 0 ? row.customer_id : row.supplier_id) || row.id} hover>
                    <TableCell>{tabValue === 0 ? row.customer_code : row.supplier_code}</TableCell>
                    <TableCell>{tabValue === 0 ? row.customer_name : row.supplier_name}</TableCell>
                    <TableCell>{row.mobile || '-'}</TableCell>
                    <TableCell>{row.email || '-'}</TableCell>
                    <TableCell>{row.address || '-'}</TableCell>
                    {tabValue === 0 && <TableCell align="right">{Number(row.credit_limit || 0).toFixed(2)}</TableCell>}
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
        <DialogTitle>{editingId ? `Edit ${entityType}` : `Add ${entityType}`}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Mobile *"
                value={form.mobile}
                onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`${entityType} ID *`}
                value={form.customer_code}
                onChange={(e) => setForm((p) => ({ ...p, customer_code: e.target.value.toUpperCase() }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={`${entityType} Name *`}
                value={form.customer_name}
                onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST No"
                value={form.gst_no}
                onChange={(e) => setForm((p) => ({ ...p, gst_no: e.target.value }))}
              />
            </Grid>
            {tabValue === 0 && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Credit Limit"
                  value={form.credit_limit}
                  onChange={(e) => setForm((p) => ({ ...p, credit_limit: e.target.value }))}
                  inputProps={{ min: 0, step: '0.01' }}
                />
              </Grid>
            )}
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

export default Customers;
