import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Save from '@mui/icons-material/Save';
import People from '@mui/icons-material/People';
import AttachMoney from '@mui/icons-material/AttachMoney';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { reportsAPI } from '../services/api';

const Payroll = () => {
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd')
  });

  const queryClient = useQueryClient();

  const { data: employeeData, isLoading: employeeLoading } = useQuery(
    ['employees', dateRange],
    () => reportsAPI.getEmployeeReport(dateRange),
    { enabled: tabValue === 0 }
  );

  const { data: salaryData, isLoading: salaryLoading } = useQuery(
    ['salary', dateRange],
    () => reportsAPI.getSalaryReport(dateRange),
    { enabled: tabValue === 1 }
  );

  const updateSalaryMutation = useMutation(
    (salaryData) => reportsAPI.updateSalary(salaryData),
    {
      onSuccess: () => {
        toast.success('Salary updated successfully');
        setEditDialog(false);
        queryClient.invalidateQueries(['salary']);
        queryClient.invalidateQueries(['employees']);
      },
      onError: (error) => {
        toast.error('Failed to update salary');
        console.error('Update error:', error);
      }
    }
  );

  const handleEditSalary = (employee) => {
    setCurrentEmployee(employee);
    setEditDialog(true);
  };

  const handleSaveSalary = () => {
    if (currentEmployee) {
      updateSalaryMutation.mutate({
        employee_id: currentEmployee.employee_id,
        amount: currentEmployee.salary,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
        department: currentEmployee.department
      });
    }
  };

  const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

  const renderLoading = (loading) => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading payroll data...</Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          <People sx={{ mr: 1, verticalAlign: 'middle' }} />
          Payroll Management
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              label="From Date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              size="small"
            />
            <TextField
              type="date"
              label="To Date"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              size="small"
            />
          </Box>
        </Box>

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<People />} label="Employees" />
          <Tab icon={<AttachMoney />} label="Salary Details" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          {renderLoading(employeeLoading)}
          {employeeData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Employees</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.total_employees || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Active Employees</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.active_employees || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">New Hires</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.new_hires || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Attrition Rate</Typography>
                      <Typography variant="h4">{(employeeData.data.summary?.attrition_rate || 0).toFixed(2)}%</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Employee Directory</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee Name</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Hire Date</TableCell>
                        <TableCell align="right">Current Salary</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(employeeData.data.detailed || []).map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.employee_name}</TableCell>
                          <TableCell>
                            <Chip 
                              label={employee.department} 
                              size="small" 
                              color="primary" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={employee.status} 
                              size="small" 
                              color={employee.status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{format(new Date(employee.hire_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell align="right">{money(employee.salary)}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditSalary(employee)}
                              color="primary"
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : (
            <Alert severity="info">No employee data available</Alert>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {renderLoading(salaryLoading)}
          {salaryData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Salary</Typography>
                      <Typography variant="h4">{money(salaryData.data.summary?.total_salary)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Average Salary</Typography>
                      <Typography variant="h4">{money(salaryData.data.summary?.average_salary)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">This Month</Typography>
                      <Typography variant="h4">{money(salaryData.data.summary?.current_month_salary)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Employees</Typography>
                      <Typography variant="h4">{salaryData.data.summary?.total_employees || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Salary Details by Department</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Employees</TableCell>
                        <TableCell align="right">Total Salary</TableCell>
                        <TableCell align="right">Average Salary</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(salaryData.data.departments || []).map((dept) => (
                        <TableRow key={dept.department}>
                          <TableCell>{dept.department}</TableCell>
                          <TableCell align="right">{dept.employee_count}</TableCell>
                          <TableCell align="right">{money(dept.total_salary)}</TableCell>
                          <TableCell align="right">{money(dept.average_salary)}</TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => handleEditSalary({
                                employee_id: dept.department,
                                department: dept.department,
                                salary: dept.average_salary
                              })}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Recent Salary Payments</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee ID</TableCell>
                        <TableCell>Payment Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Department</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(salaryData.data.detailed || []).slice(0, 10).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.employee_id}</TableCell>
                          <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell align="right">{money(payment.amount)}</TableCell>
                          <TableCell>{payment.department}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : (
            <Alert severity="info">No salary data available</Alert>
          )}
        </Box>
      )}

      {/* Edit Salary Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Edit Salary</Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Employee/Department"
              value={currentEmployee?.employee_name || currentEmployee?.department || ''}
              disabled
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Salary Amount"
              type="number"
              value={currentEmployee?.salary || ''}
              onChange={(e) => setCurrentEmployee(prev => ({ ...prev, salary: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Department"
              value={currentEmployee?.department || ''}
              onChange={(e) => setCurrentEmployee(prev => ({ ...prev, department: e.target.value }))}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveSalary}
            variant="contained"
            startIcon={<Save />}
            disabled={updateSalaryMutation.isLoading}
          >
            {updateSalaryMutation.isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;
