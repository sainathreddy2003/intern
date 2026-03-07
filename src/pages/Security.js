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
  FormControl,
  InputLabel,
  Select,
  Switch,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Block from '@mui/icons-material/Block';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import Error from '@mui/icons-material/Error';
import Refresh from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import Person from '@mui/icons-material/Person';
import History from '@mui/icons-material/History';
import Shield from '@mui/icons-material/Shield';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subDays } from 'date-fns';
import { securityAPI } from '../services/api';
import { toast } from 'react-hot-toast';

const Security = () => {
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    fromDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    userId: '',
    action: '',
    module: '',
  });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const queryClient = useQueryClient();

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

  // Security Dashboard Query
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'security-dashboard',
    securityAPI.getDashboard,
    {
      staleTime: 2 * 60 * 1000,
    }
  );

  // Audit Logs Query
  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery(
    ['audit-logs', page, rowsPerPage, filters],
    () => securityAPI.getAuditLogs({
      page: page + 1,
      limit: rowsPerPage,
      ...filters
    }),
    {
      enabled: tabValue === 1,
      staleTime: 60 * 1000,
    }
  );

  // User Sessions Query
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    ['user-sessions', page, rowsPerPage],
    () => securityAPI.getUserSessions({
      page: page + 1,
      limit: rowsPerPage
    }),
    {
      enabled: tabValue === 2,
      staleTime: 60 * 1000,
    }
  );

  // Failed Login Attempts Query
  const { data: failedLoginsData, isLoading: failedLoginsLoading } = useQuery(
    ['failed-logins', page, rowsPerPage, filters],
    () => securityAPI.getFailedLogins({
      page: page + 1,
      limit: rowsPerPage,
      ...filters
    }),
    {
      enabled: tabValue === 3,
      staleTime: 60 * 1000,
    }
  );

  // Security Settings Query
  const { data: settingsData, isLoading: settingsLoading } = useQuery(
    'security-settings',
    securityAPI.getSettings,
    {
      staleTime: 10 * 60 * 1000,
    }
  );

  // Terminate Session Mutation
  const terminateSessionMutation = useMutation(
    securityAPI.terminateSession,
    {
      onSuccess: () => {
        toast.success('Session terminated successfully');
        queryClient.invalidateQueries('user-sessions');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to terminate session');
      }
    }
  );

  // Unlock User Mutation
  const unlockUserMutation = useMutation(
    securityAPI.unlockUser,
    {
      onSuccess: () => {
        toast.success('User unlocked successfully');
        queryClient.invalidateQueries('security-dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to unlock user');
      }
    }
  );

  const dashboard = dashboardData?.data;
  const auditLogs = auditLogsData?.data;
  const sessions = sessionsData?.data;
  const failedLogins = failedLoginsData?.data;
  const settings = settingsData?.data;

  const renderDashboard = () => (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Active Sessions</Typography>
              </Box>
              <Typography variant="h4">
                {dashboard?.activeSessions || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Currently logged in users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Warning sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Failed Logins (24h)</Typography>
              </Box>
              <Typography variant="h4" color="warning.main">
                {dashboard?.failedLogins24h || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <History sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6">Audit Events (24h)</Typography>
              </Box>
              <Typography variant="h4" color="info.main">
                {dashboard?.auditLogs24h || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Security events logged
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Block sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">Locked Users</Typography>
              </Box>
              <Typography variant="h4" color="error.main">
                {dashboard?.lockedUsers || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Currently locked accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Security Events */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Security Events</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => queryClient.invalidateQueries('security-dashboard')}
          >
            Refresh
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboard?.recentEvents?.map((event, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {format(new Date(event.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>{event.full_name || 'System'}</TableCell>
                  <TableCell>
                    <Chip
                      label={event.action}
                      size="small"
                      color={
                        event.action.includes('FAILED') ? 'error' :
                        event.action.includes('LOGIN') ? 'success' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {event.ip_address}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderAuditLogs = () => (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              value={filters.toDate}
              onChange={(e) => handleFilterChange('toDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                label="Action"
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="LOGIN">Login</MenuItem>
                <MenuItem value="LOGOUT">Logout</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Module</InputLabel>
              <Select
                value={filters.module}
                label="Module"
                onChange={(e) => handleFilterChange('module', e.target.value)}
              >
                <MenuItem value="">All Modules</MenuItem>
                <MenuItem value="AUTH">Authentication</MenuItem>
                <MenuItem value="SALES">Sales</MenuItem>
                <MenuItem value="INVENTORY">Inventory</MenuItem>
                <MenuItem value="SECURITY">Security</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({
                fromDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                toDate: format(new Date(), 'yyyy-MM-dd'),
                userId: '',
                action: '',
                module: '',
              })}
              sx={{ height: '56px' }}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsDialogOpen(true)}
              sx={{ height: '56px' }}
            >
              Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Audit Logs Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Audit Logs
        </Typography>
        {auditLogsLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs?.logs?.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.full_name || log.username || 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.role_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.module} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        size="small"
                        color={
                          log.action.includes('FAILED') ? 'error' :
                          log.action.includes('LOGIN') ? 'success' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.ip_address}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={auditLogs?.pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );

  const renderUserSessions = () => (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Active User Sessions
        </Typography>
        {sessionsLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Login Time</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions?.sessions?.map((session) => (
                  <TableRow key={session.session_id}>
                    <TableCell>
                      <Typography variant="body2">
                        {session.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {session.username}
                      </Typography>
                    </TableCell>
                    <TableCell>{session.role_name}</TableCell>
                    <TableCell>
                      {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.last_activity), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {session.ip_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={session.status}
                        size="small"
                        color={session.status === 'ACTIVE' ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      {session.status === 'ACTIVE' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => terminateSessionMutation.mutate(session.session_id)}
                        >
                          <Lock />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={sessions?.pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );

  const renderFailedLogins = () => (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Failed Login Attempts
        </Typography>
        {failedLoginsLoading ? (
          <LinearProgress />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>User Agent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedLogins?.attempts?.map((attempt, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {format(new Date(attempt.attempt_time), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {attempt.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {attempt.ip_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={attempt.reason}
                        size="small"
                        color="error"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {attempt.user_agent}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={failedLogins?.pagination?.total || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );

  const renderSecuritySettings = () => (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Security Settings</Typography>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialogOpen(true)}
          >
            Configure Settings
          </Button>
        </Box>

        {settingsLoading ? (
          <LinearProgress />
        ) : settings && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Login Security
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Max Login Attempts</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {settings.max_login_attempts}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Lockout Duration (minutes)</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {settings.lockout_duration}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Force Password Change</Typography>
                    <Switch checked={settings.force_password_change} disabled />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Password Policy
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Minimum Length</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {settings.password_min_length} characters
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography>Require Uppercase</Typography>
                    <Switch checked={settings.password_require_uppercase} disabled />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography>Require Lowercase</Typography>
                    <Switch checked={settings.password_require_lowercase} disabled />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography>Require Numbers</Typography>
                    <Switch checked={settings.password_require_numbers} disabled />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Require Special Characters</Typography>
                    <Switch checked={settings.password_require_special} disabled />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Session Management
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Session Timeout (minutes)</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {settings.session_timeout}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography>Two-Factor Authentication</Typography>
                    <Switch checked={settings.two_factor_auth} disabled />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Role-Based Access Control
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography>Active Roles</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      Configured
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Shield />}
                    onClick={() => setPermissionsDialogOpen(true)}
                  >
                    Manage Permissions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
          Security Management
        </Typography>
        <Button variant="contained" startIcon={<Refresh />}>
          Refresh Data
        </Button>
      </Box>

      {/* Security Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SecurityIcon />} label="Dashboard" />
          <Tab icon={<History />} label="Audit Logs" />
          <Tab icon={<Person />} label="Sessions" />
          <Tab icon={<Warning />} label="Failed Logins" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && renderDashboard()}
      {tabValue === 1 && renderAuditLogs()}
      {tabValue === 2 && renderUserSessions()}
      {tabValue === 3 && renderFailedLogins()}
      {tabValue === 4 && renderSecuritySettings()}

      {/* Security Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Security Settings Configuration</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Security settings configuration will be implemented in the next version.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Permissions Dialog */}
      <Dialog
        open={permissionsDialogOpen}
        onClose={() => setPermissionsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Role Permissions Management</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Role permissions management will be implemented in the next version.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Security;
