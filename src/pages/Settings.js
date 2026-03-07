import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import Save from '@mui/icons-material/Save';
import RestartAlt from '@mui/icons-material/RestartAlt';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { securityAPI, authAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import SecurityIcon from '@mui/icons-material/Security';

const SECURITY_QUESTIONS = [
  "What is your favorite book?",
  "What is your favorite movie?",
  "What is your childhood nickname?",
  "What city were you born in?",
  "What is your favorite food?",
  "What was the name of your first school?",
  "What is your favorite teacher's name?",
  "What is your favorite place to visit?",
  "What is your favorite sport?",
  "What is your pet's name?"
];

const defaultSettings = {
  business_name: 'Ramesh Exports',
  business_phone: '',
  business_email: '',
  business_address: '',
  gst_no: '',
  currency_symbol: '₹',
  invoice_prefix: 'INV',
  purchase_prefix: 'PO',
  default_sales_source: 'MANUAL',
  default_payment_mode: 'CASH',
  auto_sync: true,
  sync_interval_minutes: 30,
  backup_enabled: false,
  printer_name: '',
  language: 'en',
  notifications_enabled: true,
  max_login_attempts: 5,
  lockout_duration: 30,
  force_password_change: false,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_lowercase: true,
  password_require_numbers: true,
  password_require_special: false,
  session_timeout: 60,
  two_factor_auth: false,
  invoice_company_name: '',
  invoice_address: '',
  invoice_phone: '',
  invoice_gstin: '',
  invoice_state_code: '33',
  invoice_place_of_supply: '',
  invoice_bank_name: '',
  invoice_bank_account: '',
  invoice_bank_ifsc: '',
  invoice_terms: '',
  invoice_declaration: '',
};

const Settings = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultSettings);

  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  const { data, isLoading, isError } = useQuery('security-settings', securityAPI.getSettings, {
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (data?.data) {
      setForm((prev) => ({ ...prev, ...data.data }));
    }
  }, [data]);

  const saveMutation = useMutation((payload) => securityAPI.updateSettings(payload), {
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries('security-settings');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to save settings');
    },
  });

  const setupSecurityMutation = useMutation((payload) => authAPI.setupSecurityQuestion(payload), {
    onSuccess: () => {
      toast.success('Security Question configuration updated successfully.');
      setSecurityQuestion('');
      setSecurityAnswer('');
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to set security question');
    }
  });

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify({ ...defaultSettings, ...(data?.data || {}) }), [form, data]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = () => {
    const payload = {
      ...form,
      sync_interval_minutes: Math.max(1, Number(form.sync_interval_minutes || 1)),
      max_login_attempts: Math.max(1, Number(form.max_login_attempts || 1)),
      lockout_duration: Math.max(1, Number(form.lockout_duration || 1)),
      password_min_length: Math.max(6, Number(form.password_min_length || 8)),
      session_timeout: Math.max(5, Number(form.session_timeout || 60)),
    };
    saveMutation.mutate(payload);
  };

  const saveSecurityQuestion = () => {
    if (!securityQuestion || !securityAnswer) {
      toast.error('Both Question and Answer are required');
      return;
    }
    setupSecurityMutation.mutate({ question: securityQuestion, answer: securityAnswer });
  };

  const resetDefaults = () => setForm(defaultSettings);

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RestartAlt />} onClick={resetDefaults}>
            Reset Default
          </Button>
          <Button variant="contained" startIcon={<Save />} onClick={save} disabled={saveMutation.isLoading || !dirty}>
            Save Settings
          </Button>
        </Box>
      </Box>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load settings</Alert>}
      {isLoading && <Alert severity="info" sx={{ mb: 2 }}>Loading settings...</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Business Profile</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Business Name" value={form.business_name} onChange={(e) => updateField('business_name', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Phone" value={form.business_phone} onChange={(e) => updateField('business_phone', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Email" value={form.business_email} onChange={(e) => updateField('business_email', e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Address" value={form.business_address} onChange={(e) => updateField('business_address', e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="GST No" value={form.gst_no} onChange={(e) => updateField('gst_no', e.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Invoice Configuration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Invoice Company Name" value={form.invoice_company_name} onChange={(e) => updateField('invoice_company_name', e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Invoice Address" multiline rows={2} value={form.invoice_address} onChange={(e) => updateField('invoice_address', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Invoice Phone" value={form.invoice_phone} onChange={(e) => updateField('invoice_phone', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Invoice GSTIN" value={form.invoice_gstin} onChange={(e) => updateField('invoice_gstin', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="State Code" value={form.invoice_state_code} onChange={(e) => updateField('invoice_state_code', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Place of Supply" value={form.invoice_place_of_supply} onChange={(e) => updateField('invoice_place_of_supply', e.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Bank Details (Invoice)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Bank Name" value={form.invoice_bank_name} onChange={(e) => updateField('invoice_bank_name', e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Bank Account" value={form.invoice_bank_account} onChange={(e) => updateField('invoice_bank_account', e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Bank IFSC" value={form.invoice_bank_ifsc} onChange={(e) => updateField('invoice_bank_ifsc', e.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Invoice Terms & Declaration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}><TextField fullWidth label="Terms & Conditions" multiline rows={4} value={form.invoice_terms} onChange={(e) => updateField('invoice_terms', e.target.value)} placeholder="Enter terms separated by \n" /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Declaration" multiline rows={2} value={form.invoice_declaration} onChange={(e) => updateField('invoice_declaration', e.target.value)} /></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>System Preferences</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth type="number" label="Sync Interval (min)" value={form.sync_interval_minutes} onChange={(e) => updateField('sync_interval_minutes', e.target.value)} inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Printer Name" value={form.printer_name} onChange={(e) => updateField('printer_name', e.target.value)} /></Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select value={form.language} label="Language" onChange={(e) => updateField('language', e.target.value)}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ta">Tamil</MenuItem>
                    <MenuItem value="te">Telugu</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={!!form.auto_sync} onChange={(e) => updateField('auto_sync', e.target.checked)} />} label="Auto Sync" />
                <FormControlLabel control={<Switch checked={!!form.backup_enabled} onChange={(e) => updateField('backup_enabled', e.target.checked)} />} label="Enable Backup" />
                <FormControlLabel control={<Switch checked={!!form.notifications_enabled} onChange={(e) => updateField('notifications_enabled', e.target.checked)} />} label="Notifications" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Security Defaults</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Max Login Attempts" value={form.max_login_attempts} onChange={(e) => updateField('max_login_attempts', e.target.value)} inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Lockout (min)" value={form.lockout_duration} onChange={(e) => updateField('lockout_duration', e.target.value)} inputProps={{ min: 1 }} /></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Session Timeout (min)" value={form.session_timeout} onChange={(e) => updateField('session_timeout', e.target.value)} inputProps={{ min: 5 }} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth type="number" label="Password Min Length" value={form.password_min_length} onChange={(e) => updateField('password_min_length', e.target.value)} inputProps={{ min: 6 }} /></Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <FormControlLabel control={<Switch checked={!!form.force_password_change} onChange={(e) => updateField('force_password_change', e.target.checked)} />} label="Force Password Change" />
                <FormControlLabel control={<Switch checked={!!form.two_factor_auth} onChange={(e) => updateField('two_factor_auth', e.target.checked)} />} label="Two Factor Authentication" />
                <FormControlLabel control={<Switch checked={!!form.password_require_uppercase} onChange={(e) => updateField('password_require_uppercase', e.target.checked)} />} label="Require Uppercase" />
                <FormControlLabel control={<Switch checked={!!form.password_require_lowercase} onChange={(e) => updateField('password_require_lowercase', e.target.checked)} />} label="Require Lowercase" />
                <FormControlLabel control={<Switch checked={!!form.password_require_numbers} onChange={(e) => updateField('password_require_numbers', e.target.checked)} />} label="Require Numbers" />
                <FormControlLabel control={<Switch checked={!!form.password_require_special} onChange={(e) => updateField('password_require_special', e.target.checked)} />} label="Require Special Characters" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom color="primary">
              <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
              Admin Security Recovery
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Configure a secret question to recover your Admin access if you forget your password.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Security Question</InputLabel>
                  <Select
                    value={securityQuestion}
                    label="Security Question"
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <MenuItem key={idx} value={q}>{q}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Secret Answer"
                  type="password"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter a memorable answer..."
                  autoComplete="off"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={saveSecurityQuestion}
                  disabled={setupSecurityMutation.isLoading || !securityQuestion || !securityAnswer}
                >
                  {setupSecurityMutation.isLoading ? 'Saving...' : 'Update Security Question'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
