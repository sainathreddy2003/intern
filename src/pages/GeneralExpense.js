import React, { useMemo, useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import Receipt from '@mui/icons-material/Receipt';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Search from '@mui/icons-material/Search';
import Category from '@mui/icons-material/Category';
import CalendarToday from '@mui/icons-material/CalendarToday';
import TrendingUp from '@mui/icons-material/TrendingUp';
import TrendingDown from '@mui/icons-material/TrendingDown';
import FileDownload from '@mui/icons-material/FileDownload';
import Refresh from '@mui/icons-material/Refresh';
import History from '@mui/icons-material/History';
import People from '@mui/icons-material/People';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Save from '@mui/icons-material/Save';
import Dashboard from '@mui/icons-material/Dashboard';
import PieChart from '@mui/icons-material/PieChart';
import BarChart from '@mui/icons-material/BarChart';
import Timeline from '@mui/icons-material/Timeline';
import Warning from '@mui/icons-material/Warning';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Info from '@mui/icons-material/Info';
import Person from '@mui/icons-material/Person';
import Visibility from '@mui/icons-material/Visibility';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { reportsAPI } from '../services/api';
import { Autocomplete } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const currentYear = new Date().getFullYear();
const buildBudgetPeriod = (year) => `${year}-${year + 1}`;
const currentBudgetPeriod = buildBudgetPeriod(currentYear);

const emptyExpenseForm = {
  expense_category: '',
  expense_description: '',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  payment_mode: 'CASH',
  reference_number: '',
  notes: '',
  tags: '',
  is_recurring: false,
  recurring_frequency: 'MONTHLY',
  attachment_url: '',
  status: 'PENDING',
  approved_by: '',
  budget_category: '',
  budget_year: new Date().getFullYear(),
  budget_period: currentBudgetPeriod,
  budget_allocated: 0,
  budget_remaining: 0,
  budget_variance: 0,
  is_budget_exceeded: false,
};

const expenseCategories = [
  'RENT',
  'UTILITIES',
  'SALARIES',
  'MAINTENANCE',
  'OFFICE SUPPLIES',
  'TRAVEL',
  'MARKETING',
  'INSURANCE',
  'TAXES',
  'OTHER',
];

const budgetPeriods = [
  buildBudgetPeriod(currentYear - 1),
  buildBudgetPeriod(currentYear),
  buildBudgetPeriod(currentYear + 1),
];

const budgetCategoryTypes = [
  'Planned',
  'Unplanned',
  'Emergency',
  'Recurring',
  'One-time',
];

const budgetYears = Array.from({ length: 11 }, (_, i) => 2020 + i); // 2020 to 2030

// Dynamic budget data that changes based on year and period
const getDynamicBudgetData = (year, period) => {
  console.log('getDynamicBudgetData called with:', { year, period }); // Debug log

  const baseData = {
    'RENT': {
      baseBudget: 50000,
      trend: 'stable',
      category: 'Planned',
      manager: 'John Doe',
      department: 'Operations'
    },
    'UTILITIES': {
      baseBudget: 15000,
      trend: 'decreasing',
      category: 'Planned',
      manager: 'Jane Smith',
      department: 'Operations'
    },
    'SALARIES': {
      baseBudget: 200000,
      trend: 'stable',
      category: 'Planned',
      manager: 'HR Manager',
      department: 'HR'
    },
    'MAINTENANCE': {
      baseBudget: 10000,
      trend: 'decreasing',
      category: 'Planned',
      manager: 'Facilities Manager',
      department: 'Operations'
    },
    'OFFICE SUPPLIES': {
      baseBudget: 5000,
      trend: 'stable',
      category: 'Planned',
      manager: 'Admin Manager',
      department: 'Admin'
    },
    'TRAVEL': {
      baseBudget: 8000,
      trend: 'increasing',
      category: 'Unplanned',
      manager: 'Travel Coordinator',
      department: 'Sales'
    },
    'MARKETING': {
      baseBudget: 12000,
      trend: 'decreasing',
      category: 'Planned',
      manager: 'Marketing Manager',
      department: 'Marketing'
    },
    'INSURANCE': {
      baseBudget: 8000,
      trend: 'stable',
      category: 'Recurring',
      manager: 'Finance Manager',
      department: 'Finance'
    },
    'TAXES': {
      baseBudget: 25000,
      trend: 'decreasing',
      category: 'Recurring',
      manager: 'Finance Manager',
      department: 'Finance'
    },
    'OTHER': {
      baseBudget: 10000,
      trend: 'stable',
      category: 'One-time',
      manager: 'Admin Manager',
      department: 'Admin'
    },
  };

  // Calculate adjustments based on year
  const yearMultiplier =
    year === 2024 ? 1.0 :
      year === 2025 ? 1.15 :
        year === 2026 ? 1.30 :
          year === 2027 ? 1.45 :
            year === 2028 ? 1.60 :
              year === 2029 ? 1.75 : 1.0; // 15% increase per year for more noticeable differences

  console.log('Year multiplier calculated:', { year, yearMultiplier }); // Debug log

  // Calculate adjustments based on period
  const periodMultiplier = period === '2024-2025' ? 1.0 :
    period === '2025-2026' ? 1.1 :
      period === '2026-2027' ? 1.2 :
        period === '2027-2028' ? 1.3 :
          period === '2028-2029' ? 1.4 : 1.5;

  const dynamicData = {};

  Object.entries(baseData).forEach(([category, data]) => {
    const adjustedBudget = Math.round(data.baseBudget * yearMultiplier * periodMultiplier);
    // Ensure spent doesn't exceed budget by too much - cap at 95% of budget
    const maxSpent = adjustedBudget * 0.95;
    const spent = Math.round(Math.min(maxSpent, adjustedBudget * (0.6 + Math.random() * 0.35))); // 60-95% utilization

    console.log(`Category ${category}:`, { baseBudget: data.baseBudget, adjustedBudget, yearMultiplier, periodMultiplier }); // Debug log

    dynamicData[category] = {
      budget: adjustedBudget,
      spent: spent,
      monthlyAverage: Math.round(adjustedBudget / 12),
      yearlyTotal: adjustedBudget * 12,
      alertThreshold: 80 + Math.floor(Math.random() * 15), // 80-95%
      trend: data.trend,
      lastMonthSpent: Math.round(adjustedBudget / 12 * (0.8 + Math.random() * 0.4)),
      budget_year: year,
      budget_period: period,
      budget_allocated: adjustedBudget * 12,
      budget_remaining: Math.max(0, adjustedBudget * 12 - spent),
      budget_variance: spent - adjustedBudget,
      is_budget_exceeded: spent > adjustedBudget,
      description: `${category} budget for ${period}`,
      department: data.department,
      manager: data.manager,
      approval_required: Math.round(adjustedBudget * 0.5),
      notes: `Budget allocation for ${category} in ${period}`,
    };
  });

  return dynamicData;
};

const paymentModes = ['CASH', 'BANK TRANSFER', 'CHEQUE', 'CREDIT CARD', 'DEBIT CARD', 'OTHER'];
const recurringFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
const commonTags = ['URGENT', 'RECURRING', 'BUDGET', 'APPROVED', 'PERSONAL', 'BUSINESS'];
const getExpenseDateValue = (expense) => expense?.expense_date || expense?.date;
const toValidDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};
const getExpenseCategoryValue = (expense) => expense?.expense_category || expense?.category || 'OTHER';
const getExpenseDescriptionValue = (expense) => expense?.expense_description || expense?.description || '';
const getExpensePaymentModeValue = (expense) => expense?.payment_mode || expense?.payment_method || '';

// Filter functions for different tabs
const filterExpensesByPeriod = (expenses, filter, month = null, year = null) => {
  const now = new Date();
  const currentYear = year || now.getFullYear();
  const currentMonth = month !== null ? month : now.getMonth();

  switch (filter) {
    case 'all':
      return expenses;
    case 'yearly':
      return expenses.filter(expense => {
        const expenseDate = toValidDate(getExpenseDateValue(expense));
        if (!expenseDate) return false;
        return expenseDate.getFullYear() === currentYear;
      });
    case 'monthly':
      return expenses.filter(expense => {
        const expenseDate = toValidDate(getExpenseDateValue(expense));
        if (!expenseDate) return false;
        return expenseDate.getMonth() === currentMonth &&
          expenseDate.getFullYear() === currentYear;
      });
    default:
      return expenses;
  }
};

const getFilteredStatsByBudgetPeriod = (expenses, fromYear, toYear) => {
  let filteredExpenses = [];

  // Filter expenses by year range
  filteredExpenses = expenses.filter(expense => {
    const expenseDate = toValidDate(getExpenseDateValue(expense));
    if (!expenseDate) return false;
    const expenseYear = expenseDate.getFullYear();
    return expenseYear >= fromYear && expenseYear <= toYear;
  });

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const thisMonthAmount = filteredExpenses
    .filter((e) => {
      const expenseDate = toValidDate(getExpenseDateValue(e));
      if (!expenseDate) return false;
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
    const category = getExpenseCategoryValue(expense);
    acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return {
    totalAmount,
    thisMonthAmount,
    categoryBreakdown,
    total: filteredExpenses.length,
    thisMonth: filteredExpenses.filter((e) => {
      const expenseDate = toValidDate(getExpenseDateValue(e));
      if (!expenseDate) return false;
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    }).length
  };
};

const getFilteredStats = (expenses, filter, month = null, year = null) => {
  const filteredExpenses = filterExpensesByPeriod(expenses, filter, month, year);
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const thisMonthAmount = filteredExpenses
    .filter((e) => {
      const expenseDate = toValidDate(getExpenseDateValue(e));
      if (!expenseDate) return false;
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
    const category = getExpenseCategoryValue(expense);
    acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  return {
    totalAmount,
    thisMonthAmount,
    categoryBreakdown,
    total: filteredExpenses.length,
    thisMonth: filteredExpenses.filter((e) => {
      const expenseDate = toValidDate(getExpenseDateValue(e));
      if (!expenseDate) return false;
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    }).length
  };
};

const GeneralExpense = () => {
  const getDaysInMonth = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

  const resolveEmployeeMonthDays = () => getDaysInMonth(selectedYear, selectedMonth);

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyExpenseForm);
  const [dateFilter, setDateFilter] = useState({
    fromDate: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [currentTab, setCurrentTab] = useState(0);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [overviewFilter, setOverviewFilter] = useState('all');
  const [expensesFilter, setExpensesFilter] = useState('all');
  const [analyticsFilter, setAnalyticsFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialog, setEditDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [fromYear, setFromYear] = useState(currentYear);
  const [toYear, setToYear] = useState(currentYear + 1);
  const [excelAddDialog, setExcelAddDialog] = useState(false);
  const [bulkAddingExpenses, setBulkAddingExpenses] = useState(false);
  const [excelExpenses, setExcelExpenses] = useState(
    Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      expense_category: '',
      amount: '',
      expense_description: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      payment_mode: '',
      status: '',
      reference_number: '',
      budget_category: '',
      budget_year: new Date().getFullYear(),
      budget_period: currentBudgetPeriod,
      budget_allocated: '',
      is_recurring: false,
      recurring_frequency: 'MONTHLY',
      notes: ''
    }))
  );
  const [chartFilter, setChartFilter] = useState('all');
  const [excelBudgetDialog, setExcelBudgetDialog] = useState(false);
  const [excelBudgets, setExcelBudgets] = useState(
    Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      category: '',
      budget: '',
      budget_year: '',
      description: '',
      department: '',
      manager: '',
      approval_required: 0
    }))
  );
  const [budgetCategoryTypes, setBudgetCategoryTypes] = useState([
    'Planned',
    'Unplanned',
    'Emergency',
    'Operations',
    'Marketing',
    'Sales',
    'IT & Technology',
    'Human Resources',
    'Research & Development',
    'Infrastructure',
    'Training & Development',
    'Legal & Compliance',
    'Travel & Entertainment',
    'Office Supplies',
    'Maintenance',
    'Utilities',
    'Insurance',
    'Taxes',
    'Depreciation',
    'Other',
    'Recurring',
    'One-time',
  ]);
  const [departments, setDepartments] = useState([
    'IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Engineering'
  ]);
  const [positions, setPositions] = useState([
    'Manager', 'Developer', 'Designer', 'Analyst', 'Coordinator', 'Specialist', 'Director'
  ]);
  const [expenseStatuses, setExpenseStatuses] = useState(['PENDING', 'PAID']);

  // State for managing editable employee data
  const [editableEmployees, setEditableEmployees] = useState([]);
  // State for managing new empty rows
  const [newEmployeeRows, setNewEmployeeRows] = useState(Array.from({ length: 20 }, (_, index) => ({
    id: `new-${index}`,
    employee_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    salary: '',
    reduction: '',
    total_days_per_month: getDaysInMonth(new Date().getFullYear(), new Date().getMonth()),
    totalDays: '',
    marginDays: '',
    status: 'ACTIVE',
    isNew: true
  })));

  // State for managing budget periods
  const [budgetPeriodsList, setBudgetPeriodsList] = useState(budgetPeriods);
  const [newBudgetPeriod, setNewBudgetPeriod] = useState('');
  const [addBudgetPeriodDialog, setAddBudgetPeriodDialog] = useState(false);

  // Budget Period API - Sync with real backend
  const { data: budgetPeriodsData, isLoading: budgetPeriodsLoading } = useQuery(
    ['budgetPeriods'],
    async () => {
      try {
        const response = await reportsAPI.getBudgetPeriods();
        if (response?.data?.periods) return response;
        throw new Error('Fallback required');
      } catch (error) {
        console.log('API endpoint not available, using localStorage fallback');
        const localPeriods = JSON.parse(localStorage.getItem('budgetPeriods') || '[]');
        if (localPeriods.length > 0) {
          return { data: { periods: localPeriods.map(p => ({ name: p })) } };
        }
        return { data: { periods: budgetPeriods.map(p => ({ name: p })) } };
      }
    },
    {
      onSuccess: (data) => {
        if (data?.data?.periods) {
          setBudgetPeriodsList(data.data.periods.map(p => p.name || p));
        }
      }
    }
  );

  const addBudgetPeriodMutation = useMutation(
    async (periodData) => {
      try {
        return await reportsAPI.addBudgetPeriod(periodData);
      } catch (error) {
        // Fallback to localStorage for robustness if backend is down
        const localBudgetPeriods = JSON.parse(localStorage.getItem('budgetPeriods') || '[]');
        if (!localBudgetPeriods.includes(periodData.name)) {
          localBudgetPeriods.push(periodData.name);
          localStorage.setItem('budgetPeriods', JSON.stringify(localBudgetPeriods));
          return { data: { period: { name: periodData.name } } };
        }
        throw error;
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['budgetPeriods']);
        setNewBudgetPeriod('');
        setAddBudgetPeriodDialog(false);
        toast.success('Budget period added successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to add budget period: ${error.message || 'Unknown error'}`);
      }
    }
  );
  const [excelEmployeeDialog, setExcelEmployeeDialog] = useState(false);
  const [salaryDetailsDialog, setSalaryDetailsDialog] = useState(false);
  const [salaryViewMode, setSalaryViewMode] = useState('monthly'); // 'monthly' or 'yearly'
  const [excelEmployees, setExcelEmployees] = useState(
    Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      name: '',
      email: '',
      department: '',
      position: '',
      employeeCode: '',
      salary: '',
      deduction: '',
      totalDaysInMonth: getDaysInMonth(new Date().getFullYear(), new Date().getMonth()),
      hire_date: format(new Date(), 'yyyy-MM-dd'),
      status: ''
    }))
  );
  const queryClient = useQueryClient();

  // Excel-style employee management functions
  const handleOpenExcelEmployeeDialog = () => {
    console.log('Add Employee button clicked!');
    setExcelEmployeeDialog(true);
  };

  // Salary details functions
  const handleOpenSalaryDetails = () => {
    setSalaryDetailsDialog(true);
  };

  const handleViewEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeDetailsDialog(true);
  };

  const calculateMonthlySalary = (employee) => {
    const monthlySalary = Number(employee.salary) || 0;
    const totalDaysInMonth = Math.max(1, Number(employee.total_days_per_month) || resolveEmployeeMonthDays());
    const presentDaysRaw =
      employee.present_days ??
      employee.presentDays ??
      employee.total_day_present ??
      null;
    const presentDaysParsed = Number(presentDaysRaw);
    const presentDays = Number.isFinite(presentDaysParsed)
      ? Math.min(Math.max(presentDaysParsed, 0), totalDaysInMonth)
      : 0;
    const deductionDays = Math.max(totalDaysInMonth - presentDays, 0);
    const perDaySalary = monthlySalary / totalDaysInMonth;
    const reduction = Number((perDaySalary * deductionDays).toFixed(2));
    const inHandSalary = Math.max(0, Number((monthlySalary - reduction).toFixed(2)));
    const hasAttendance = presentDays > 0;

    return {
      monthlySalary,
      totalDaysInMonth,
      presentDays,
      deductionDays,
      perDaySalary,
      reduction,
      inHandSalary,
      yearlySalary: Number((inHandSalary * 12).toFixed(2)),
      hasAttendance,
    };
  };

  // Function to add new budget period
  const handleAddBudgetPeriod = () => {
    if (newBudgetPeriod.trim() && !budgetPeriodsList.includes(newBudgetPeriod.trim())) {
      const periodData = {
        name: newBudgetPeriod.trim(),
        description: `Budget period ${newBudgetPeriod.trim()}`
      };

      // Try to save to API first
      addBudgetPeriodMutation.mutate(periodData);

      // Fallback: also save to localStorage for immediate UI update
      const localBudgetPeriods = JSON.parse(localStorage.getItem('budgetPeriods') || '[]');
      if (!localBudgetPeriods.includes(newBudgetPeriod.trim())) {
        localBudgetPeriods.push(newBudgetPeriod.trim());
        localStorage.setItem('budgetPeriods', JSON.stringify(localBudgetPeriods));

        // Update UI immediately for better UX
        setTimeout(() => {
          if (!budgetPeriodsList.includes(newBudgetPeriod.trim())) {
            setBudgetPeriodsList([...budgetPeriodsList, newBudgetPeriod.trim()]);
          }
        }, 1000);
      }
    } else if (budgetPeriodsList.includes(newBudgetPeriod.trim())) {
      toast.error('Budget period already exists!');
    }
  };

  // Calculate filtered employees based on year and month
  const getFilteredEmployees = () => {
    const employees = (editableEmployees || []).filter(
      (employee) => String(employee.employee_name || employee.name || '').trim() !== ''
    );
    if (!employees.length) return [];

    const periodEnd = salaryViewMode === 'monthly'
      ? new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999)
      : new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    return employees.filter((employee) => {
      if (!employee.hire_date) return true;
      const hireDate = new Date(employee.hire_date);
      if (Number.isNaN(hireDate.getTime())) return true;
      return hireDate <= periodEnd;
    });
  };

  // Calculate filtered summary
  const getFilteredSummary = () => {
    const filteredEmployees = getFilteredEmployees();
    const totalEmployees = filteredEmployees.length;

    if (salaryViewMode === 'monthly') {
      const totalMonthly = filteredEmployees.reduce((sum, emp) => sum + Number(calculateMonthlySalary(emp).inHandSalary || 0), 0);
      const totalYearly = filteredEmployees.reduce((sum, emp) => {
        const calc = calculateMonthlySalary(emp);
        const yearly = calc.hasAttendance ? calc.yearlySalary : (calc.inHandSalary * 12);
        return sum + Number(yearly || 0);
      }, 0);

      return {
        totalEmployees,
        totalMonthly,
        totalYearly,
        period: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth] + ' ' + selectedYear
      };
    } else {
      const totalYearly = filteredEmployees.reduce((sum, emp) => {
        const calc = calculateMonthlySalary(emp);
        const yearly = calc.hasAttendance ? calc.yearlySalary : (calc.inHandSalary * 12);
        return sum + Number(yearly || 0);
      }, 0);
      const avgMonthly = totalEmployees > 0 ? Math.round(totalYearly / 12 / totalEmployees) : 0;

      return {
        totalEmployees,
        totalYearly,
        avgMonthly,
        period: `Year ${selectedYear}`
      };
    }
  };

  // Calculate salary totals for display
  const calculateSalaryTotals = () => {
    const summary = getFilteredSummary();
    return {
      totalSalary: salaryViewMode === 'monthly' ? summary.totalMonthly : summary.totalYearly,
      totalEmployees: summary.totalEmployees,
      period: summary.period
    };
  };

  // Employee details dialog state
  const [employeeDetailsDialog, setEmployeeDetailsDialog] = useState(false);
  const [employeeDetailsViewMode, setEmployeeDetailsViewMode] = useState('monthly');

  const handleAddExcelEmployeeRow = () => {
    const newId = Math.max(...excelEmployees.map(e => e.id)) + 1;
    setExcelEmployees([...excelEmployees, {
      id: newId,
      name: '',
      email: '',
      department: '',
      position: '',
      salary: '',
      hire_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'ACTIVE'
    }]);
  };

  const handleRemoveExcelEmployeeRow = (id) => {
    if (excelEmployees.length > 1) {
      setExcelEmployees(excelEmployees.filter(employee => employee.id !== id));
    }
  };

  const handleExcelEmployeeChange = (id, field, value) => {
    setExcelEmployees(excelEmployees.map(employee =>
      employee.id === id ? {
        ...employee,
        [field]: value,
        // Automatically set current hire date when any field is changed
        hire_date: format(new Date(), 'yyyy-MM-dd')
      } : employee
    ));
  };

  const handleExcelEmployeeSubmit = () => {
    console.log('Current excelEmployees:', excelEmployees);
    console.log('Number of employees:', excelEmployees.length);

    // Check each employee individually
    excelEmployees.forEach((employee, index) => {
      console.log(`Employee ${index + 1}:`, {
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        salary: employee.salary,
        employeeCode: employee.employeeCode,
        nameLength: employee.name?.length,
        emailLength: employee.email?.length,
        deptLength: employee.department?.length,
        posLength: employee.position?.length,
        salaryLength: employee.salary?.length,
        codeLength: employee.employeeCode?.length
      });
    });

    const validEmployees = excelEmployees.filter(employee =>
      employee.name && employee.name.trim() !== '' &&
      employee.department && employee.department.trim() !== '' &&
      employee.salary && String(employee.salary).trim() !== ''
    );

    console.log('Valid employees found:', validEmployees.length);

    if (validEmployees.length === 0) {
      toast.error('Please fill in at least one complete employee entry (Name, Department, Salary)');
      return;
    }

    // Submit each employee with proper salary mapping
    validEmployees.forEach(employee => {
      const salary = Number(employee.salary) || 0;
      const deduction = Number(employee.deduction) || 0;
      const netSalary = salary - deduction;

      addEmployeeMutation.mutate({
        ...employee,
        employee_code: employee.employeeCode || `EMP${Date.now()}`,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        total_salary: salary,
        deduction: deduction,
        net_salary: netSalary,
        salary: salary, // Keep for backward compatibility
        hire_date: employee.hire_date,
        status: employee.status || 'ACTIVE'
      });
    });

    toast.success(`${validEmployees.length} employees added successfully!`);
    setExcelEmployeeDialog(false);
    setExcelEmployees([{
      id: 1,
      name: '',
      email: '',
      department: '',
      position: '',
      employeeCode: '',
      salary: '',
      deduction: '',
      status: 'ACTIVE',
      hire_date: format(new Date(), 'yyyy-MM-dd')
    }]);
  };

  // Excel-style budget management functions
  const handleOpenExcelBudgetDialog = () => {
    console.log('Add Budget button clicked!');
    setExcelBudgetDialog(true);
  };

  const handleAddExcelBudgetRow = () => {
    const newId = Math.max(...excelBudgets.map(b => b.id)) + 1;
    setExcelBudgets([...excelBudgets, {
      id: newId,
      category: '',
      budget: '',
      budget_year: new Date().getFullYear(),
      description: '',
      department: '',
      manager: '',
      approval_required: 0
    }]);
  };

  const handleRemoveExcelBudgetRow = (id) => {
    if (excelBudgets.length > 1) {
      setExcelBudgets(excelBudgets.filter(budget => budget.id !== id));
    }
  };

  const handleExcelBudgetChange = (id, field, value) => {
    setExcelBudgets(excelBudgets.map(budget =>
      budget.id === id ? { ...budget, [field]: value } : budget
    ));
  };

  const handleExcelBudgetSubmit = () => {
    const validBudgets = excelBudgets.filter(budget =>
      budget.category &&
      budget.budget &&
      budget.budget_year
    );

    if (validBudgets.length === 0) {
      toast.error('Please fill in at least one complete budget entry');
      return;
    }

    // Submit each budget
    validBudgets.forEach(budget => {
      createBudgetMutation.mutate({
        ...budget,
        budget: Number(budget.budget)
      });
    });

    toast.success(`${validBudgets.length} budgets added successfully!`);
    setExcelBudgetDialog(false);
    setExcelBudgets([{
      id: 1,
      category: '',
      budget: '',
      budget_year: new Date().getFullYear(),
      description: '',
      department: '',
      manager: '',
      approval_required: 0
    }]);
  };

  // Keyboard navigation for Excel dialog
  const handleKeyDown = (e) => {
    if (excelAddDialog) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const activeElement = document.activeElement;
        const inputs = document.querySelectorAll('input, select, textarea');
        const currentIndex = Array.from(inputs).indexOf(activeElement);

        if (e.shiftKey) {
          // Shift + Tab: Previous field
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : inputs.length - 1;
          if (prevIndex >= 0 && prevIndex < inputs.length) {
            inputs[prevIndex].focus();
          }
        } else {
          // Tab: Next field
          const nextIndex = currentIndex < inputs.length - 1 ? currentIndex + 1 : 0;
          if (nextIndex >= 0 && nextIndex < inputs.length) {
            inputs[nextIndex].focus();
          }
        }
      } else if (e.key === 'Enter') {
        if (e.ctrlKey) {
          // Ctrl + Enter: Submit form
          e.preventDefault();
          handleExcelSubmit();
        } else {
          // Enter: Next field
          e.preventDefault();
          const activeElement = document.activeElement;
          const inputs = document.querySelectorAll('input, select, textarea');
          const currentIndex = Array.from(inputs).indexOf(activeElement);
          const nextIndex = currentIndex < inputs.length - 1 ? currentIndex + 1 : 0;
          if (nextIndex >= 0 && nextIndex < inputs.length) {
            inputs[nextIndex].focus();
          }
        }
      } else if (e.key === 'ArrowUp') {
        // Arrow Up: Previous row
        e.preventDefault();
        const activeElement = document.activeElement;
        const inputs = document.querySelectorAll('input, select, textarea');
        const currentIndex = Array.from(inputs).indexOf(activeElement);
        const currentRow = Math.floor(currentIndex / 10); // Assuming 10 fields per row
        const prevRow = currentRow > 0 ? currentRow - 1 : 0;
        const targetIndex = prevRow * 10 + Math.min(currentIndex % 10, 9);
        if (targetIndex >= 0 && targetIndex < inputs.length) {
          inputs[targetIndex].focus();
        }
      } else if (e.key === 'ArrowDown') {
        // Arrow Down: Next row
        e.preventDefault();
        const activeElement = document.activeElement;
        const inputs = document.querySelectorAll('input, select, textarea');
        const currentIndex = Array.from(inputs).indexOf(activeElement);
        const currentRow = Math.floor(currentIndex / 10); // Assuming 10 fields per row
        const nextRow = currentRow < Math.floor(inputs.length / 10) - 1 ? currentRow + 1 : Math.floor(inputs.length / 10) - 1;
        const targetIndex = nextRow * 10 + Math.min(currentIndex % 10, 9);
        if (targetIndex >= 0 && targetIndex < inputs.length) {
          inputs[targetIndex].focus();
        }
      } else if (e.key === 'ArrowRight') {
        // Arrow Right: Next field in same row
        e.preventDefault();
        const activeElement = document.activeElement;
        const inputs = document.querySelectorAll('input, select, textarea');
        const currentIndex = Array.from(inputs).indexOf(activeElement);
        const currentRow = Math.floor(currentIndex / 10);
        const nextIndex = currentRow * 10 + Math.min((currentIndex % 10) + 1, 9);
        if (nextIndex >= 0 && nextIndex < inputs.length) {
          inputs[nextIndex].focus();
        }
      } else if (e.key === 'ArrowLeft') {
        // Arrow Left: Previous field in same row
        e.preventDefault();
        const activeElement = document.activeElement;
        const inputs = document.querySelectorAll('input, select, textarea');
        const currentIndex = Array.from(inputs).indexOf(activeElement);
        const currentRow = Math.floor(currentIndex / 10);
        const prevIndex = currentRow * 10 + Math.max((currentIndex % 10) - 1, 0);
        if (prevIndex >= 0 && prevIndex < inputs.length) {
          inputs[prevIndex].focus();
        }
      } else if (e.key === 'Escape') {
        // Escape: Close dialog
        e.preventDefault();
        setExcelAddDialog(false);
      }
    }
  };

  // Filter data based on overview filter
  const getFilteredDataByOverview = () => {
    if (overviewFilter === 'all') {
      return expenses;
    }

    const [from, to] = overviewFilter.split('-').map(Number);
    return expenses.filter(expense => {
      const expenseYear = new Date(expense.expense_date).getFullYear();
      return expenseYear >= from && expenseYear <= to;
    });
  };

  // Calculate filtered stats
  const getFilteredStatsByOverview = () => {
    const filteredExpenses = getFilteredDataByOverview();
    const total = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      const category = expense.expense_category || 'Unknown';
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    const statusBreakdown = filteredExpenses.reduce((acc, expense) => {
      const status = expense.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const recurringExpenses = filteredExpenses.filter(expense => expense.is_recurring).length;
    const recurringAmount = filteredExpenses
      .filter(expense => expense.is_recurring)
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const totalBudget = 1000000; // Default budget
    const budgetUtilization = totalBudget > 0 ? (totalAmount / totalBudget) * 100 : 0;

    return {
      total,
      totalAmount,
      categoryBreakdown,
      statusBreakdown,
      recurringExpenses,
      recurringAmount,
      totalBudget,
      budgetUtilization,
      thisMonthAmount: totalAmount,
      thisMonth: total
    };
  };

  // Excel-style expense management functions
  const handleOpenExcelDialog = () => {
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      setExcelAddDialog(true);
    }, 50);
  };

  const handleAddExcelRow = () => {
    const newId = Math.max(...excelExpenses.map(e => e.id)) + 1;
    setExcelExpenses([...excelExpenses, {
      id: newId,
      expense_category: '',
      amount: '',
      expense_description: '',
      expense_date: format(new Date(), 'yyyy-MM-dd'),
      payment_mode: 'CASH',
      status: 'PENDING',
      reference_number: '',
      budget_category: 'Planned',
      budget_year: new Date().getFullYear(),
      budget_period: currentBudgetPeriod,
      budget_allocated: '',
      is_recurring: false,
      recurring_frequency: 'MONTHLY',
      notes: ''
    }]);
  };

  const handleRemoveExcelRow = (id) => {
    if (excelExpenses.length > 1) {
      setExcelExpenses(excelExpenses.filter(expense => expense.id !== id));
    }
  };

  const handleExcelExpenseChange = (id, field, value) => {
    setExcelExpenses(excelExpenses.map(expense =>
      expense.id === id ? {
        ...expense,
        [field]: value,
        // Automatically set current date when any field is changed
        expense_date: format(new Date(), 'yyyy-MM-dd')
      } : expense
    ));
  };

  const handleExcelSubmit = async () => {
    const validExpenses = excelExpenses.filter(expense =>
      expense.expense_category &&
      expense.amount &&
      expense.expense_description
      // expense_date is automatically set, so no need to validate
    );

    if (validExpenses.length === 0) {
      toast.error('Please fill in at least one complete expense entry');
      return;
    }

    setBulkAddingExpenses(true);
    try {
      const results = await Promise.allSettled(
        validExpenses.map(expense => reportsAPI.createExpense({
          ...expense,
          amount: Number(expense.amount),
          budget_allocated: expense.budget_allocated ? Number(expense.budget_allocated) : 0
        }))
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      queryClient.invalidateQueries(['general-expenses']);

      if (successCount > 0 && failCount === 0) {
        toast.success(`${successCount} expense${successCount > 1 ? 's' : ''} added successfully!`);
        setExcelAddDialog(false);
        setExcelExpenses([{
          id: 1,
          expense_category: '',
          amount: '',
          expense_description: '',
          expense_date: format(new Date(), 'yyyy-MM-dd'),
          payment_mode: 'CASH',
          status: 'PENDING',
          reference_number: '',
          budget_category: 'Planned',
          budget_year: new Date().getFullYear(),
          budget_period: currentBudgetPeriod,
          budget_allocated: '',
          is_recurring: false,
          recurring_frequency: 'MONTHLY',
          notes: ''
        }]);
      } else if (successCount > 0 && failCount > 0) {
        toast.error(`${failCount} failed, ${successCount} added successfully`);
      } else {
        const firstErr = results.find(r => r.status === 'rejected');
        const message = firstErr?.reason?.message || 'Failed to add expense';
        toast.error(message);
      }
    } finally {
      setBulkAddingExpenses(false);
    }
  };

  // Payroll data queries
  const { data: employeeData, isLoading: employeeLoading } = useQuery(
    ['employees'],
    () => reportsAPI.getEmployeeReport({
      fromDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd')
    }),
    { enabled: currentTab === 4 }
  );

  // Sync editable employees with employee data
  useEffect(() => {
    if (employeeData?.data?.detailed) {
      setEditableEmployees(employeeData.data.detailed);
    }
  }, [employeeData]);

  const { data: salaryData, isLoading: salaryLoading } = useQuery(
    ['salary'],
    () => reportsAPI.getSalaryReport({
      fromDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd')
    }),
    { enabled: currentTab === 4 }
  );

  // Employee mutations
  const addEmployeeMutation = useMutation(
    (employeeData) => reportsAPI.addEmployee(employeeData),
    {
      onSuccess: () => {
        toast.success('Employee added successfully');
        setAddDialog(false);
        queryClient.invalidateQueries(['employees']);
      },
      onError: (error) => {
        toast.error('Failed to add employee');
        console.error('Add error:', error);
      }
    }
  );

  const updateEmployeeMutation = useMutation(
    (employeeData) => reportsAPI.updateEmployee(employeeData),
    {
      onSuccess: () => {
        toast.success('Employee updated successfully');
        setEditDialog(false);
        setSelectedEmployee(null);
        queryClient.invalidateQueries(['employees']);
      },
      onError: (error) => {
        toast.error('Failed to update employee');
        console.error('Update error:', error);
      }
    }
  );

  const updateSalaryMutation = useMutation(
    (salaryData) => reportsAPI.updateSalary(salaryData),
    {
      onSuccess: () => {
        toast.success('Salary updated successfully');
        setEditDialog(false);
        setSelectedEmployee(null);
        queryClient.invalidateQueries(['employees', 'salary']);
      },
      onError: (error) => {
        toast.error('Failed to update salary');
        console.error('Update error:', error);
      }
    }
  );
  const [analyticsPeriod, setAnalyticsPeriod] = useState('monthly');
  const [selectedBudgetYear, setSelectedBudgetYear] = useState(new Date().getFullYear());
  const [selectedBudgetPeriod, setSelectedBudgetPeriod] = useState(currentBudgetPeriod);

  // Real budget categories state fetched from API
  const { data: budgetsData, isLoading: budgetsLoading } = useQuery(
    ['budgets', selectedBudgetYear, selectedBudgetPeriod],
    () => reportsAPI.getBudgets({
      budget_year: selectedBudgetYear,
      budget_period: selectedBudgetPeriod
    }),
    {
      onSuccess: (data) => console.log('Budgets loaded from backend:', data)
    }
  );

  // Derive budgetCategories from fetched data or fallback to mock
  const budgetCategories = useMemo(() => {
    if (budgetsData?.data && Array.isArray(budgetsData.data) && budgetsData.data.length > 0) {
      const mapped = {};
      budgetsData.data.forEach(b => {
        const allocated = Number(b.allocated_amount ?? b.budget_allocated ?? b.budget ?? 0);
        const spent = Number(b.spent_amount ?? b.spent ?? 0);
        mapped[b.category] = {
          ...b,
          budget: allocated,
          budget_allocated: allocated,
          spent,
          monthlyAverage: Number(b.monthly_average ?? allocated / 12),
          lastMonthSpent: Number(b.last_month_spent ?? 0),
          alertThreshold: Number(b.alertThreshold ?? b.alert_threshold ?? 80),
          trend: b.trend || 'stable'
        };
      });
      return mapped;
    }
    return {};
  }, [budgetsData, selectedBudgetYear, selectedBudgetPeriod]);

  // Connect to real backend API
  const { data, isLoading } = useQuery(
    ['general-expenses', search, dateFilter.fromDate, dateFilter.toDate, selectedBudgetYear, selectedBudgetPeriod],
    () => reportsAPI.getExpenseReport({
      fromDate: dateFilter.fromDate || (selectedBudgetYear ? `${selectedBudgetYear}-01-01` : format(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), 'yyyy-MM-dd')),
      toDate: dateFilter.toDate || (selectedBudgetYear ? `${selectedBudgetYear}-12-31` : format(new Date(), 'yyyy-MM-dd')),
    }),
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const expenses = Array.isArray(data?.data?.expenses) ? data.data.expenses : [];

  // Debug: Log the raw expenses data
  console.log('Raw API Response:', data);
  console.log('Expenses Array:', expenses);
  console.log('Date Filter:', dateFilter);

  const createMutation = useMutation((payload) => {
    return reportsAPI.createExpense(payload);
  }, {
    onSuccess: () => {
      toast.success('Expense added successfully!');
      queryClient.invalidateQueries(['general-expenses']);
      setOpen(false);
      setForm(emptyExpenseForm);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    }
  });

  const updateMutation = useMutation(({ id, payload }) => {
    return reportsAPI.updateExpense(id, payload);
  }, {
    onSuccess: () => {
      toast.success('Expense updated successfully!');
      queryClient.invalidateQueries(['general-expenses']);
      setOpen(false);
      setEditingId(null);
      setForm(emptyExpenseForm);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });

  const deleteMutation = useMutation((id) => {
    return reportsAPI.deleteExpense(id);
  }, {
    onSuccess: () => {
      toast.success('Expense deleted successfully!');
      queryClient.invalidateQueries(['general-expenses']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });

  const createBudgetMutation = useMutation((payload) => {
    return reportsAPI.createBudget(payload);
  }, {
    onSuccess: () => {
      toast.success('Budget added successfully!');
      queryClient.invalidateQueries(['budgets']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add budget');
    },
  });

  const updateBudgetMutation = useMutation(({ id, payload }) => {
    return reportsAPI.updateBudget(id, payload);
  }, {
    onSuccess: () => {
      toast.success('Budget updated successfully!');
      queryClient.invalidateQueries(['budgets']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update budget');
    },
  });

  const deleteBudgetMutation = useMutation((id) => {
    return reportsAPI.deleteBudget(id);
  }, {
    onSuccess: () => {
      toast.success('Budget deleted successfully!');
      queryClient.invalidateQueries(['budgets']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete budget');
    },
  });

  const stats = useMemo(() => {
    // Use filtered expenses based on analytics filter
    const filteredExpenses = filterExpensesByPeriod(expenses, analyticsFilter, selectedMonth, selectedYear);

    const total = filteredExpenses.length;
    const thisMonth = filteredExpenses.filter((e) => {
      const expenseDate = new Date(e.expense_date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear();
    }).length;
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const thisMonthAmount = filteredExpenses
      .filter((e) => {
        const expenseDate = new Date(e.expense_date);
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Budget analytics
    const totalBudget = Object.values(budgetCategories).reduce((sum, cat) => (
      sum + Number(cat.budget_allocated ?? cat.allocated_amount ?? cat.budget ?? 0)
    ), 0);

    // Calculate spent from actual filtered expense data, not budget categories
    const totalSpent = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Monthly allocation (total budget divided by 12)
    const monthlyAllocation = totalBudget / 12;

    // Status breakdown
    const statusBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.status] = (acc[expense.status] || 0) + 1;
      return acc;
    }, {});

    // Category breakdown
    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.expense_category] = (acc[expense.expense_category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    // Recurring expenses
    const recurringExpenses = filteredExpenses.filter(e => e.is_recurring).length;
    const recurringAmount = filteredExpenses
      .filter(e => e.is_recurring)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Generate date-based trend data from filtered expenses
    const getDateBasedTrend = () => {
      if (!dateFilter.fromDate || !dateFilter.toDate) {
        // Fallback to monthly trend if no date range selected
        return [
          { month: 'Aug', amount: 245000, budget: 340000 },
          { month: 'Sep', amount: 268000, budget: 340000 },
          { month: 'Oct', amount: 289000, budget: 340000 },
          { month: 'Nov', amount: 276000, budget: 340000 },
          { month: 'Dec', amount: 298000, budget: 340000 },
          { month: 'Jan', amount: totalAmount, budget: 340000 },
        ];
      }

      const fromDate = new Date(dateFilter.fromDate);
      const toDate = new Date(dateFilter.toDate);
      console.log('From Date:', fromDate, 'To Date:', toDate);
      console.log('Filtered Expenses Count:', filteredExpenses.length);
      const trendData = [];

      // Create date range entries
      const currentDate = new Date(fromDate);
      while (currentDate <= toDate) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const dayExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.expense_date);
          return expenseDate.toISOString().slice(0, 10) === dateStr;
        });

        const dayAmount = dayExpenses.reduce((sum, expense) =>
          sum + Number(expense.amount || 0), 0
        );

        trendData.push({
          date: dateStr,
          label: format(currentDate, 'MMM dd'),
          amount: dayAmount,
          budget: 340000 / 30 // Daily budget approximation
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
      console.log('Generated Trend Data:', trendData);
      return trendData;
    };

    const monthlyTrend = getDateBasedTrend();

    // Payment mode breakdown
    const paymentBreakdown = filteredExpenses.reduce((acc, expense) => {
      acc[expense.payment_mode] = (acc[expense.payment_mode] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});

    // Budget alerts
    const budgetAlerts = Object.entries(budgetCategories)
      .filter(([_, budget]) => {
        const spent = Number(budget?.spent || 0);
        const allocated = Number(budget?.budget || budget?.budget_allocated || 0);
        const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
        return utilization >= Number(budget?.alertThreshold || 80);
      })
      .map(([category, budget]) => {
        const spent = Number(budget?.spent || 0);
        const allocated = Number(budget?.budget || budget?.budget_allocated || 0);
        return {
          category,
          utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
          spent,
          budget: allocated,
          trend: budget?.trend || 'stable',
        };
      });

    // Year over year comparison (mock data - would be calculated from filtered data)
    const yearOverYear = {
      currentYear: totalAmount,
      lastYear: totalAmount * 0.92, // Simulated 8% growth
      growth: 8.8,
    };

    return {
      total,
      thisMonth,
      totalAmount,
      thisMonthAmount,
      totalBudget,
      totalSpent,
      remainingBudget,
      monthlyAllocation,
      budgetUtilization,
      statusBreakdown,
      categoryBreakdown,
      recurringExpenses,
      recurringAmount,
      monthlyTrend,
      paymentBreakdown,
      budgetAlerts,
      yearOverYear,
    };
  }, [expenses]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.expense_category || !form.expense_description || !form.amount) {
      toast.error('Please fill all required fields');
      return;
    }

    const payload = {
      ...form,
      amount: Number(form.amount),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (expense) => {
    setForm({
      expense_category: expense.expense_category || expense.category || '',
      expense_description: expense.expense_description || expense.description || '',
      amount: (expense.amount || 0).toString(),
      expense_date: expense.expense_date ? format(new Date(expense.expense_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      payment_mode: expense.payment_mode || expense.payment_method || 'CASH',
      reference_number: expense.reference_number || '',
      notes: expense.notes || '',
      tags: expense.tags || '',
      is_recurring: expense.is_recurring || false,
      recurring_frequency: expense.recurring_frequency || 'MONTHLY',
      attachment_url: expense.attachment_url || '',
      status: expense.status || 'PENDING',
      approved_by: expense.approved_by || '',
      budget_category: expense.budget_category || 'Planned',
      budget_year: Number(expense.budget_year || selectedBudgetYear || new Date().getFullYear()),
      budget_period: expense.budget_period || selectedBudgetPeriod || currentBudgetPeriod,
      budget_allocated: Number(expense.budget_allocated || 0),
      budget_remaining: Number(expense.budget_remaining || 0),
      budget_variance: Number(expense.budget_variance || 0),
      is_budget_exceeded: Boolean(expense.is_budget_exceeded),
    });
    setEditingId(expense.id || expense._id || null);
    setOpen(true);
  };

  const handleDelete = (id) => {
    const targetId = id || null;
    if (!targetId) {
      toast.error('Invalid expense id');
      return;
    }
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(targetId);
    }
  };

  const handleExport = async (formatType) => {
    if (formatType === 'pdf') {
      try {
        const exportParams = {
          fromDate: dateFilter.fromDate || (selectedBudgetYear ? `${selectedBudgetYear}-01-01` : format(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), 'yyyy-MM-dd')),
          toDate: dateFilter.toDate || (selectedBudgetYear ? `${selectedBudgetYear}-12-31` : format(new Date(), 'yyyy-MM-dd')),
          budgetYear: selectedBudgetYear,
          budgetPeriod: selectedBudgetPeriod
        };

        const blob = await reportsAPI.exportReport('expenses', exportParams);
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `expense_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          toast.success('PDF report exported successfully');
        }
      } catch (error) {
        console.error('PDF Export error:', error);
        toast.error('Failed to export PDF');
      }
      return;
    }

    const dataToExport = filteredExpenses.map(expense => {
      const rawDate = expense.expense_date || expense.date;
      const dateObj = rawDate ? new Date(rawDate) : null;
      const hasValidDate = dateObj && !Number.isNaN(dateObj.getTime());
      return {
        Date: hasValidDate ? format(dateObj, 'dd MMM yyyy') : '',
        Category: expense.expense_category || expense.category || '',
        Description: expense.expense_description || expense.description || '',
        Amount: Number(expense.amount || 0),
        'Payment Mode': expense.payment_mode || expense.payment_method || 'CASH',
        Reference: expense.reference_number || expense.receipt_number || '',
        Status: expense.status || 'PENDING',
        Tags: expense.tags || '',
        Notes: expense.notes || '',
      };
    });

    if (dataToExport.length === 0) {
      toast.error('No data available to export');
      return;
    }

    if (formatType === 'csv') {
      try {
        const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [
          Object.keys(dataToExport[0]).join(','),
          ...dataToExport.map(row => Object.values(row).map(escapeCSV).join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Expenses exported successfully');
      } catch (error) {
        console.error('CSV Export error:', error);
        toast.error('Failed to export CSV');
      }
    } else {
      toast(`${formatType.toUpperCase()} export coming soon!`);
    }
  };

  // Budget management functions - Using Excel-style entry only

  // Edit budget using Excel-style dialog
  const handleEditBudgetExcel = (category) => {
    const budget = budgetCategories[category];
    if (budget) {
      const budgetValue = Number(budget?.budget || budget?.budget_allocated || budget?.allocated_amount || 0);
      // Pre-fill the Excel dialog with existing budget data
      setExcelBudgets([{
        id: budget.id || budget._id || 1,
        category: category,
        budget: budgetValue.toString(),
        budget_year: budget.budget_year || selectedBudgetYear,
        budget_period: budget.budget_period || selectedBudgetPeriod,
        budget_category: budget.budget_category || 'Planned',
        monthly_average: budget.monthly_average?.toString() || Math.round(budgetValue / 12),
        description: budget.description || '',
        department: budget.department || '',
        manager: budget.manager || '',
        alertThreshold: budget.alertThreshold || 80,
        approval_required: budget.approval_required || 0,
        notes: budget.notes || '',
      }]);
      setExcelBudgetDialog(true);
    }
  };

  // Delete budget category
  const handleDeleteBudget = (category) => {
    const budget = budgetCategories[category];
    if (window.confirm(`Are you sure you want to remove the ${category} budget?`)) {
      const budgetId = budget?.id || budget?._id;
      if (budgetId) {
        deleteBudgetMutation.mutate(budgetId);
      } else {
        toast.error('Only saved backend budgets can be deleted');
      }
    }
  };






  const filteredExpenses = useMemo(() => {
    let filtered = expenses;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(expense =>
        getExpenseCategoryValue(expense).toLowerCase().includes(search.toLowerCase()) ||
        getExpenseDescriptionValue(expense).toLowerCase().includes(search.toLowerCase()) ||
        getExpensePaymentModeValue(expense).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply date filter
    if (dateFilter.fromDate && dateFilter.toDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = toValidDate(getExpenseDateValue(expense));
        if (!expenseDate) return false;
        const fromDate = new Date(dateFilter.fromDate);
        const toDate = new Date(dateFilter.toDate);
        return expenseDate >= fromDate && expenseDate <= toDate;
      });
    }

    // Apply year range filter only when explicit date range is not selected.
    if (!dateFilter.fromDate || !dateFilter.toDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = toValidDate(getExpenseDateValue(expense));
        if (!expenseDate) return false;
        const expenseYear = expenseDate.getFullYear();
        return expenseYear >= fromYear && expenseYear <= toYear;
      });
    }

    return filtered;
  }, [expenses, search, dateFilter, fromYear, toYear]);

  const historyStats = useMemo(() => {
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const categoryBreakdown = filteredExpenses.reduce((acc, expense) => {
      const category = getExpenseCategoryValue(expense);
      acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
      return acc;
    }, {});
    const thisMonthAmount = filteredExpenses
      .filter((expense) => {
        const expenseDate = toValidDate(getExpenseDateValue(expense));
        if (!expenseDate) return false;
        const now = new Date();
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    return { totalAmount, categoryBreakdown, thisMonthAmount };
  }, [filteredExpenses]);

  return (
    <>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, p: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          General Expense Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleOpenExcelDialog}
            sx={{ display: currentTab === 1 ? 'block' : 'none' }}
          >
            Add Expense
          </Button>
          <Button
            variant="outlined"
            startIcon={<Category />}
            onClick={handleOpenExcelBudgetDialog}
            sx={{ display: currentTab === 3 ? 'block' : 'none' }}
          >
            Add Budget
          </Button>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={handleOpenExcelEmployeeDialog}
            sx={{ display: currentTab === 4 ? 'block' : 'none' }}
          >
            Add Employee
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={(event) => setExportMenuAnchor(event.currentTarget)}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={() => { handleExport('csv'); setExportMenuAnchor(null); }}>
              Export CSV
            </MenuItem>
            <MenuItem onClick={() => { handleExport('pdf'); setExportMenuAnchor(null); }}>
              Export PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<Dashboard />} />
          <Tab label="Expenses" icon={<Receipt />} />
          <Tab label="Analytics" icon={<BarChart />} />
          <Tab label="Budget" icon={<Category />} />
          <Tab label="Payroll" icon={<AttachMoney />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {currentTab === 0 && (
        // Overview Tab
        <Box>
          {/* Filter Controls */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="h6" sx={{ mr: 2 }}>Budget Period:</Typography>
              </Grid>
              <Grid item>
                <FormControl size="small" sx={{ mr: 2 }}>
                  <Select
                    value={overviewFilter}
                    onChange={(e) => setOverviewFilter(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {budgetPeriods.map((period) => (
                      <MenuItem key={period} value={period}>{period}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => queryClient.invalidateQueries(['general-expenses'])}
                >
                  Refresh Data
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Enhanced Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Receipt sx={{ color: '#1976d2' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#1976d2">
                    ₹{historyStats.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fromYear} to {toYear}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp sx={{ color: '#2f9e44' }} />
                    <Typography variant="h6" color="text.secondary">
                      Monthly Average
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#2f9e44">
                    ₹{Math.round(historyStats.thisMonthAmount / 30).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Category sx={{ color: '#f58a07' }} />
                    <Typography variant="h6" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    {Object.keys(historyStats.categoryBreakdown).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ color: '#d32f2f' }} />
                    <Typography variant="h6" color="text.secondary">
                      This Month
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#d32f2f">
                    {format(new Date(), 'MMM yyyy')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Insights */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Top Categories
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(historyStats.categoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([category, amount]) => (
                        <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Category fontSize="small" />
                            <Typography variant="body2">{category}</Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday />
                    Recent Activity
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      return filteredExpenses.slice(0, 3).map((expense) => (
                        <Box key={expense.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{getExpenseCategoryValue(expense)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(() => {
                                const dt = toValidDate(getExpenseDateValue(expense));
                                return dt ? format(dt, 'MMM dd') : '-';
                              })()}
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{expense.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ));
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 1 && (
        // Overview Tab
        <Box>
          {/* Enhanced Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Expenses
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This Month: {stats.thisMonth}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    ₹{stats.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This Month: ₹{stats.thisMonthAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Budget Used
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={stats.budgetUtilization > 80 ? '#d32f2f' : '#2f9e44'}>
                    {stats.budgetUtilization.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.budgetUtilization, 100)}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color={stats.budgetUtilization > 80 ? 'error' : 'success'}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Recurring
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="#1976d2">
                    {stats.recurringExpenses}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Auto-recurring expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 1 && (
        // Expenses Tab
        <Box>
          {/* Budget Period & Controls - Grid Layout */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday />
                    Budget Period
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={`${fromYear}-${toYear}`}
                      onChange={(e) => {
                        const [from, to] = e.target.value.split('-').map(Number);
                        setFromYear(from);
                        setToYear(to);
                      }}
                      sx={{ minWidth: 120 }}
                    >
                      {budgetPeriods.map((period) => (
                        <MenuItem key={period} value={period}>{period}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Refresh />
                    Expense History
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => queryClient.invalidateQueries(['general-expenses'])}
                      fullWidth
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<History />}
                      onClick={() => setShowHistory(true)}
                      sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
                      fullWidth
                    >
                      History
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Period Summary
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Total Expenses:</Typography>
                      <Typography variant="h6" color="primary">
                        ₹{getFilteredStatsByBudgetPeriod(expenses, fromYear, toYear).totalAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Categories:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Object.keys(getFilteredStatsByBudgetPeriod(expenses, fromYear, toYear).categoryBreakdown).length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Status Breakdown and Top Categories */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChart />
                    Status Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      const budgetStats = getFilteredStatsByBudgetPeriod(expenses, fromYear, toYear);
                      const statusBreakdown = {
                        PAID: 0,
                        PENDING: 0,
                        APPROVED: 0
                      };

                      budgetStats.total > 0 && expenses.filter(expense => {
                        const expenseDate = toValidDate(getExpenseDateValue(expense));
                        if (!expenseDate) return false;
                        const expenseYear = expenseDate.getFullYear();
                        return expenseYear >= fromYear && expenseYear <= toYear;
                      }).forEach(expense => {
                        const status = expense.status === 'APPROVED' ? 'PAID' : expense.status;
                        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
                      });

                      return Object.entries(statusBreakdown).map(([status, count]) => (
                        <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip
                            label={status}
                            size="small"
                            color={
                              status === 'PAID' ? 'success' :
                                status === 'PENDING' ? 'warning' : 'default'
                            }
                          />
                          <Typography variant="h6" color="primary">
                            {count}
                          </Typography>
                        </Box>
                      ));
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Top Categories
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(getFilteredStatsByBudgetPeriod(expenses, fromYear, toYear).categoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([category, amount]) => (
                        <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Category fontSize="small" />
                            <Typography variant="body2">{category}</Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 2 && (
        // Analytics Tab
        <Box>
          {/* Filter Controls */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Typography variant="h6" sx={{ mr: 2 }}>Budget Period:</Typography>
              </Grid>
              <Grid item>
                <FormControl size="small" sx={{ mr: 2 }}>
                  <Select
                    value={overviewFilter}
                    onChange={(e) => setOverviewFilter(e.target.value)}
                    sx={{ minWidth: 120 }}
                  >
                    <MenuItem value="all">All</MenuItem>
                    {budgetPeriods.map((period) => (
                      <MenuItem key={period} value={period}>{period}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => queryClient.invalidateQueries(['general-expenses'])}
                >
                  Refresh Data
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Analytics Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Expense Analytics
            </Typography>
          </Box>

          {/* Key Metrics */}

          {/* Charts Row 1 */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Revenue & Profit Trends
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={{
                        labels: stats.monthlyTrend.map(item => item.label || item.month),
                        datasets: [
                          {
                            label: 'Expenses',
                            data: stats.monthlyTrend.map(item => item.amount),
                            backgroundColor: '#f58a07',
                            borderColor: '#f58a07',
                            borderWidth: 1,
                          },
                          {
                            label: 'Budget',
                            data: stats.monthlyTrend.map(item => item.budget),
                            backgroundColor: '#1976d2',
                            borderColor: '#1976d2',
                            borderWidth: 1,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString();
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            display: true,
                            title: {
                              display: true,
                              text: 'Date'
                            }
                          },
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function (value) {
                                return '₹' + value.toLocaleString();
                              }
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PieChart />
                    Category Distribution
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(stats.categoryBreakdown).map(([category, amount]) => {
                      const percentage = (amount / stats.totalAmount) * 100;
                      return (
                        <Box key={category}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {category}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                              {percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Row 2 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Receipt />
                    Payment Mode Analysis
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(stats.paymentBreakdown).map(([mode, amount]) => {
                      const percentage = (amount / stats.totalAmount) * 100;
                      return (
                        <Box key={mode} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">{mode}</Typography>
                            <Chip
                              label={`${percentage.toFixed(1)}%`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant="h6" sx={{ fontSize: '0.9rem' }}>
                            ₹{amount.toLocaleString()}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Year Over Year Comparison
                  </Typography>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" fontWeight={700} color="#2f9e44" gutterBottom>
                      +{stats.yearOverYear.growth}%
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      Growth Rate
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                      <Box textAlign="center">
                        <Typography variant="h6" color="text.secondary">
                          Last Year
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          ₹{(stats.yearOverYear.lastYear / 1000000).toFixed(1)}M
                        </Typography>
                      </Box>
                      <Box textAlign="center">
                        <Typography variant="h6" color="text.secondary">
                          Current Year
                        </Typography>
                        <Typography variant="h5" fontWeight={600}>
                          ₹{(stats.yearOverYear.currentYear / 1000000).toFixed(1)}M
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {currentTab === 3 && (
        // Budget Tab
        <Box>
          {/* Budget Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              Budget Management
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                label="Budget Period"
                value={selectedBudgetPeriod}
                onChange={(e) => setSelectedBudgetPeriod(e.target.value)}
                sx={{ minWidth: 150 }}
                placeholder={currentBudgetPeriod}
                InputProps={{
                  list: 'header-budget-periods'
                }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Category />}
                onClick={() => setAddBudgetPeriodDialog(true)}
              >
                Budget Period
              </Button>
              <datalist id="header-budget-periods">
                {budgetPeriodsList.map((period) => (
                  <option key={period} value={period}>
                    {period}
                  </option>
                ))}
              </datalist>
              <FormControlLabel
                control={
                  <Switch
                    checked={budgetAlerts}
                    onChange={(e) => setBudgetAlerts(e.target.checked)}
                    size="small"
                  />
                }
                label="Alerts"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={() => queryClient.invalidateQueries('general-expenses')}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Budget Alerts */}
          {budgetAlerts && stats.budgetAlerts.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Budget Alerts
                </Typography>
                <List dense>
                  {stats.budgetAlerts.map((alert, index) => (
                    <ListItem key={index} sx={{ py: 0 }}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${alert.category} budget utilization at ${alert.utilization.toFixed(1)}%`}
                        secondary={`₹${alert.spent.toLocaleString()} of ₹${alert.budget.toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Alert>
          )}

          {/* Budget Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Category sx={{ color: '#1976d2' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Budget
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#1976d2">
                    ₹{stats.totalBudget.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monthly allocation: ₹{stats.monthlyAllocation?.toLocaleString() || '0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Receipt sx={{ color: '#f58a07' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Spent
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    ₹{stats.totalSpent.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    This month: ₹{stats.thisMonthAmount?.toLocaleString() || '0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp sx={{ color: '#2f9e44' }} />
                    <Typography variant="h6" color="text.secondary">
                      Remaining
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#2f9e44">
                    ₹{stats.remainingBudget?.toLocaleString() || '0'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Available budget
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BarChart sx={{ color: stats.budgetUtilization > 80 ? '#d32f2f' : '#2f9e44' }} />
                    <Typography variant="h6" color="text.secondary">
                      Utilization
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color={stats.budgetUtilization > 80 ? '#d32f2f' : '#2f9e44'}>
                    {stats.budgetUtilization.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.budgetUtilization, 100)}
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color={stats.budgetUtilization > 80 ? 'error' : 'success'}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Detailed Budget Categories */}
          <Typography variant="h6" gutterBottom>
            Category-wise Budget Details
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(budgetCategories).map(([category, budget]) => {
              const budgetValue = Number(budget?.budget || budget?.budget_allocated || 0);
              const spentValue = Number(budget?.spent || 0);
              const monthlyAverage = Number(budget?.monthlyAverage || budgetValue / 12 || 0);
              const lastMonthSpent = Number(budget?.lastMonthSpent || 0);
              const alertThreshold = Number(budget?.alertThreshold || 80);
              const utilization = budgetValue > 0 ? (spentValue / budgetValue) * 100 : 0;
              const variance = spentValue - monthlyAverage;
              const variancePercentage = monthlyAverage > 0 ? (variance / monthlyAverage) * 100 : 0;
              const isOverBudget = utilization > 100;
              const isNearLimit = utilization >= alertThreshold;

              return (
                <Grid item xs={12} sm={6} md={4} key={category}>
                  <Card sx={{
                    border: isOverBudget ? '2px solid #d32f2f' : isNearLimit ? '2px solid #ff9800' : '1px solid #e0e0e0',
                    position: 'relative'
                  }}>
                    {isOverBudget && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <ErrorIcon color="error" fontSize="small" />
                      </Box>
                    )}
                    {isNearLimit && !isOverBudget && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Warning color="warning" fontSize="small" />
                      </Box>
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                            {category}
                          </Typography>
                          <Chip
                            label={budget.trend}
                            size="small"
                            color={
                              budget.trend === 'increasing' ? 'error' :
                                budget.trend === 'decreasing' ? 'success' : 'default'
                            }
                            icon={
                              budget.trend === 'increasing' ? <TrendingUp /> :
                                budget.trend === 'decreasing' ? <TrendingDown /> : undefined
                            }
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditBudgetExcel(category)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBudget(category)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Budget
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            ₹{budgetValue.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Spent
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color={isOverBudget ? 'error' : 'text.primary'}>
                            ₹{spentValue.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Remaining
                          </Typography>
                          <Typography variant="body2" fontWeight={600} color={spentValue < budgetValue ? 'success' : 'error'}>
                            ₹{Math.max(0, budgetValue - spentValue).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>

                      <LinearProgress
                        variant="determinate"
                        value={Math.min(utilization, 100)}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          mb: 1,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: isOverBudget ? '#d32f2f' : isNearLimit ? '#ff9800' : '#2f9e44'
                          }
                        }}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {utilization.toFixed(1)}% utilized
                        </Typography>
                        <Typography variant="caption" color={variance > 0 ? 'error' : 'success'}>
                          {variance > 0 ? '+' : ''}{variancePercentage.toFixed(1)}% vs avg
                        </Typography>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          Monthly Avg: ₹{monthlyAverage.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last Month: ₹{lastMonthSpent.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Budget Insights */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                Budget Insights
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Top Performing Categories:</strong>
                  </Typography>
                  <List dense>
                    {Object.entries(budgetCategories)
                      .filter(([_, budget]) => {
                        const allocated = Number(budget?.budget || budget?.budget_allocated || 0);
                        const spent = Number(budget?.spent || 0);
                        return allocated > 0 ? (spent / allocated) < 0.8 : false;
                      })
                      .slice(0, 3)
                      .map(([category, budget]) => {
                        const allocated = Number(budget?.budget || budget?.budget_allocated || 0);
                        const spent = Number(budget?.spent || 0);
                        const utilized = allocated > 0 ? (spent / allocated) * 100 : 0;
                        return (
                        <ListItem key={category} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={category}
                            secondary={`${utilized.toFixed(1)}% utilized`}
                          />
                        </ListItem>
                        );
                      })}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Needs Attention:</strong>
                  </Typography>
                  <List dense>
                    {stats.budgetAlerts.slice(0, 3).map((alert, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Warning color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={alert.category}
                          secondary={`${alert.utilization.toFixed(1)}% utilized`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {currentTab === 4 && (
        // Payroll Tab
        <Box>
          {/* Payroll Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney />
              Payroll Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AttachMoney />}
                onClick={handleOpenSalaryDetails}
              >
                Salary Details
              </Button>
              <TextField
                type="date"
                label="From Date"
                size="small"
                value={format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd')}
                sx={{ minWidth: 150 }}
              />
              <TextField
                type="date"
                label="To Date"
                size="small"
                value={format(new Date(), 'yyyy-MM-dd')}
                sx={{ minWidth: 150 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={() => queryClient.invalidateQueries(['employees', 'salary'])}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Payroll Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <People sx={{ color: '#1976d2' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Employees
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#1976d2">
                    {employeeLoading ? 'Loading...' : (employeeData?.data?.summary?.total_employees || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active: {employeeLoading ? 'Loading...' : (employeeData?.data?.summary?.active_employees || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AttachMoney sx={{ color: '#2f9e44' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Payroll
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#2f9e44">
                    {salaryLoading ? 'Loading...' : `₹${(salaryData?.data?.summary?.total_salary || 0).toLocaleString()}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Monthly average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp sx={{ color: '#f58a07' }} />
                    <Typography variant="h6" color="text.secondary">
                      Avg Salary
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    {salaryLoading ? 'Loading...' : `₹${Math.round(salaryData?.data?.summary?.average_salary || 0).toLocaleString()}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Per employee
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Category sx={{ color: '#d32f2f' }} />
                    <Typography variant="h6" color="text.secondary">
                      Departments
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#d32f2f">
                    {salaryLoading ? 'Loading...' : (salaryData?.data?.departments?.length || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active teams
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Employee Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People />
                Employee Directory
              </Typography>
              {employeeLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    Loading employee data...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please wait while we fetch employee information
                  </Typography>
                </Box>
              ) : employeeData?.data?.detailed?.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Salary</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(employeeData?.data?.detailed || []).map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>{employee.employee_name}</TableCell>
                          <TableCell>
                            <Chip label={employee.department} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={employee.status}
                              size="small"
                              color={employee.status === 'Active' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            ₹{(employee.salary || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setEditDialog(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No employee data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category />
                    Department Salary Breakdown
                  </Typography>
                  {salaryLoading ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Loading department data...
                      </Typography>
                    </Box>
                  ) : salaryData?.data?.departments?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {(salaryData?.data?.departments || []).map((dept) => (
                        <Box key={dept.department} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{dept.department}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {dept.employee_count} employees • Avg: ₹{Math.round((dept.average_salary || 0) / 1000).toFixed(0)}K
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{Math.round((dept.total_salary || 0) / 1000).toFixed(0)}K
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No department data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Payroll Insights
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Highest Paid Department</Typography>
                      <Typography variant="h6" color="primary">
                        {salaryLoading ? 'Loading...' : (salaryData?.data?.departments?.[0]?.department || 'N/A')}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Monthly Payroll</Typography>
                      <Typography variant="h6" color="success.main">
                        {salaryLoading ? 'Loading...' : `₹${(salaryData?.data?.summary?.total_salary || 0).toLocaleString()}`}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Average Salary Growth</Typography>
                      <Typography variant="h6" color="warning.main">+8.5%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Payroll Efficiency</Typography>
                      <Typography variant="h6" color="info.main">92%</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Excel Style Add Expense Dialog */}
      <Dialog
        open={excelAddDialog}
        onClose={() => setExcelAddDialog(false)}
        maxWidth="xl"
        fullWidth
        onKeyDown={handleKeyDown}
        transitionDuration={{ enter: 100, exit: 100 }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Add />
          Add Multiple Expenses - Excel Style Entry
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple expenses in a spreadsheet-like format. Fill in required fields (marked with *) for each row.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Keyboard Shortcuts:</strong> Tab/Shift+Tab (navigate), Enter (next field), Arrow Up/Down (navigate rows), Ctrl+Enter (submit)
            </Typography>
          </Box>

          {/* Excel-like Table */}
          {/* Excel-like Table */}
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 'calc(100vh - 300px)', // Use maximum available height
              mb: 2,
              width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              // 1. General Cell Styling
              '& .MuiTableCell-root': {
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderBottom: 'none',
                borderRight: '1px solid #f0f0f0',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },

              // 2. Header Styling (Orange Color)
              '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableHead-root th': {
                backgroundColor: '#f47c20 !important', // <--- ORANGE COLOR HERE
                color: '#ffffff !important', // White text
                fontWeight: 600,
                textAlign: 'left',
                borderBottom: 'none !important',
                borderTop: 'none !important',
                borderRight: '1px solid rgba(255,255,255,0.15) !important', // Faint white divider
                whiteSpace: 'nowrap',
                padding: '8px 8px', // Slightly more padding for the header to look balanced
              },

              // 3. Zebra Striping for Rows
              '& .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root': {
                backgroundColor: '#ffffff',
              },
              '& .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root': {
                backgroundColor: '#fffaf6',
              },
              '& .MuiTableRow-root:hover .MuiTableCell-root': {
                backgroundColor: '#fdf0e6',
              },

              // 4. Invisible Inputs (until focused)
              '& .MuiInputBase-root': {
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #f47c20',
                borderRadius: '2px',
              },
              '& .MuiInputBase-input': {
                padding: '4px 8px !important',
              }
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                borderCollapse: 'separate',
                borderSpacing: 0,
                width: '100%',
                tableLayout: 'fixed',
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 50, textAlign: 'center' }}>S.No</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Category*</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Amount*</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Description*</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Payment Mode</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Reference Number</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Date</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Budget Category</TableCell>
                  <TableCell sx={{ minWidth: 90, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excelExpenses.map((expense, index) => (
                  <TableRow key={expense.id} hover>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 500, color: '#666' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={expense.expense_category}
                        onChange={(event, newValue) => {
                          if (newValue && !expenseCategories.includes(newValue)) {
                            setExpenseCategories([...expenseCategories, newValue]);
                          }
                          handleExcelExpenseChange(expense.id, 'expense_category', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelExpenseChange(expense.id, 'expense_category', newInputValue);
                        }}
                        options={expenseCategories}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderInput={(params) => (
                          <TextField {...params} required placeholder="" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={expense.amount}
                        onChange={(e) => handleExcelExpenseChange(expense.id, 'amount', e.target.value)}
                        placeholder=""
                        required
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={expense.expense_description}
                        onChange={(e) => handleExcelExpenseChange(expense.id, 'expense_description', e.target.value)}
                        placeholder=""
                        required
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={expense.payment_mode}
                        onChange={(event, newValue) => {
                          if (newValue && !paymentModes.includes(newValue)) {
                            setPaymentModes([...paymentModes, newValue]);
                          }
                          handleExcelExpenseChange(expense.id, 'payment_mode', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelExpenseChange(expense.id, 'payment_mode', newInputValue);
                        }}
                        options={paymentModes}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={expense.status}
                        onChange={(event, newValue) => {
                          if (newValue && !expenseStatuses.includes(newValue)) {
                            setExpenseStatuses([...expenseStatuses, newValue]);
                          }
                          handleExcelExpenseChange(expense.id, 'status', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelExpenseChange(expense.id, 'status', newInputValue);
                        }}
                        options={expenseStatuses}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="" />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={expense.reference_number}
                        onChange={(e) => handleExcelExpenseChange(expense.id, 'reference_number', e.target.value)}
                        placeholder=""
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="date"
                        value={expense.expense_date}
                        onChange={(e) => handleExcelExpenseChange(expense.id, 'expense_date', e.target.value)}
                        placeholder=""
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={expense.budget_category}
                        onChange={(event, newValue) => {
                          if (newValue && !budgetCategoryTypes.includes(newValue)) {
                            setBudgetCategoryTypes([...budgetCategoryTypes, newValue]);
                          }
                          handleExcelExpenseChange(expense.id, 'budget_category', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelExpenseChange(expense.id, 'budget_category', newInputValue);
                        }}
                        options={budgetCategoryTypes}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="" />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Button
                        size="small"
                        onClick={() => handleRemoveExcelRow(expense.id)}
                        disabled={excelExpenses.length === 1}
                        sx={{
                          minWidth: 'auto',
                          padding: '2px 8px',
                          backgroundColor: '#e0e0e0',
                          color: '#d32f2f',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          '&:hover': { backgroundColor: '#d5d5d5' },
                          '&.Mui-disabled': { backgroundColor: '#f5f5f5', color: '#bdbdbd' }
                        }}
                      >
                        Del
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Row Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddExcelRow}
              size="small"
            >
              Add New Row
            </Button>
            <Typography variant="caption" color="text.secondary">
              {excelExpenses.length} expense(s) ready to add
            </Typography>
          </Box>

          {/* Summary */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Summary:</strong> {excelExpenses.filter(e => e.expense_category && e.amount && e.expense_description && e.expense_date).length} complete expense(s) ready to submit.
              Total amount: ₹{excelExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0).toLocaleString()}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelAddDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleExcelSubmit}
            disabled={bulkAddingExpenses}
          >
            {bulkAddingExpenses ? 'Adding...' : `Add ${excelExpenses.filter(e => e.expense_category && e.amount && e.expense_description && e.expense_date).length} Expenses`}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Excel Style Add Budget Dialog */}
      <Dialog open={excelBudgetDialog} onClose={() => setExcelBudgetDialog(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Category />
          Add Multiple Budgets - Excel Style Entry
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple budgets in a spreadsheet-like format. Fill in required fields (marked with *) for each row.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Keyboard Shortcuts:</strong> Tab/Shift+Tab (navigate), Enter (next field), Arrow Up/Down (navigate rows), Ctrl+Enter (submit)
            </Typography>
          </Box>

          {/* Excel-like Table */}
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 'calc(100vh - 300px)', // Use maximum available height
              mb: 2,
              width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              // 1. General Cell Styling
              '& .MuiTableCell-root': {
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderBottom: 'none',
                borderRight: '1px solid #f0f0f0',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },

              // 2. Header Styling (Orange Color)
              '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableHead-root th': {
                backgroundColor: '#f47c20 !important', // <--- ORANGE COLOR HERE
                color: '#ffffff !important', // White text
                fontWeight: 600,
                textAlign: 'left',
                borderBottom: 'none !important',
                borderTop: 'none !important',
                borderRight: '1px solid rgba(255,255,255,0.15) !important', // Faint white divider
                whiteSpace: 'nowrap',
                padding: '8px 8px', // Slightly more padding for header to look balanced
              },

              // 3. Zebra Striping for Rows
              '& .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root': {
                backgroundColor: '#ffffff',
              },
              '& .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root': {
                backgroundColor: '#fffaf6',
              },
              '& .MuiTableRow-root:hover .MuiTableCell-root': {
                backgroundColor: '#fdf0e6',
              },

              // 4. Invisible Inputs (until focused)
              '& .MuiInputBase-root': {
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #f47c20',
                borderRadius: '2px',
              },
              '& .MuiInputBase-input': {
                padding: '4px 8px !important',
              }
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                borderCollapse: 'separate',
                borderSpacing: 0,
                width: '100%',
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  border: '1px solid #d4d4d4'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '40px', textAlign: 'center' }}>S.No</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '18%' }}>Category*</TableCell>
                  <TableCell sx={{ minWidth: 100, width: '14%' }}>Budget Amount*</TableCell>
                  <TableCell sx={{ minWidth: 150, width: '22%' }}>Description*</TableCell>
                  <TableCell sx={{ minWidth: 100, width: '12%' }}>Budget Year*</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '17%' }}>Department</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '17%' }}>Manager</TableCell>
                  <TableCell sx={{ minWidth: 80, width: '5%', textAlign: 'center' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excelBudgets.map((budget, index) => (
                  <TableRow key={budget.id} hover>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 500, color: '#666' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={budget.category}
                        onChange={(event, newValue) => {
                          // If new category, add it to the list
                          if (newValue && !budgetCategoryTypes.includes(newValue)) {
                            setBudgetCategoryTypes([...budgetCategoryTypes, newValue]);
                          }
                          handleExcelBudgetChange(budget.id, 'category', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelBudgetChange(budget.id, 'category', newInputValue);
                        }}
                        options={budgetCategoryTypes}
                        filterOptions={(options, params) => {
                          const filtered = options.filter(option =>
                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                          );

                          // Suggest the input value as an option if it's not already in the list
                          if (params.inputValue !== '' && !filtered.includes(params.inputValue)) {
                            filtered.push(params.inputValue);
                          }

                          return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            required
                            placeholder=""
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={budget.budget}
                        onChange={(e) => handleExcelBudgetChange(budget.id, 'budget', e.target.value)}
                        placeholder=""
                        InputProps={{ startAdornment: '₹' }}
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={budget.description}
                        onChange={(e) => handleExcelBudgetChange(budget.id, 'description', e.target.value)}
                        placeholder=""
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={budget.budget_year}
                        onChange={(e) => handleExcelBudgetChange(budget.id, 'budget_year', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={budget.department}
                        onChange={(e) => handleExcelBudgetChange(budget.id, 'department', e.target.value)}
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={budget.manager}
                        onChange={(e) => handleExcelBudgetChange(budget.id, 'manager', e.target.value)}
                        placeholder=""
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveExcelBudgetRow(budget.id)}
                        color="error"
                        disabled={excelBudgets.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Row Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddExcelBudgetRow}
              size="small"
            >
              Add New Row
            </Button>
            <Typography variant="caption" color="text.secondary">
              {excelBudgets.length} budget(s) ready to add
            </Typography>
          </Box>

          {/* Summary */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Summary:</strong> {excelBudgets.filter(b => b.category && b.budget && b.budget_year).length} complete budget(s) ready to submit.
              Total budget amount: ₹{excelBudgets.reduce((sum, b) => sum + (Number(b.budget) || 0), 0).toLocaleString()}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelBudgetDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleExcelBudgetSubmit}
            disabled={createBudgetMutation.isLoading}
          >
            {createBudgetMutation.isLoading ? 'Adding...' : `Add ${excelBudgets.filter(b => b.category && b.budget && b.budget_year).length} Budgets`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Excel Style Add Employee Dialog */}
      <Dialog open={excelEmployeeDialog} onClose={() => setExcelEmployeeDialog(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          Add Multiple Employees - Excel Style Entry
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter multiple employees in a spreadsheet-like format. Fill in required fields (marked with *) for each row.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Keyboard Shortcuts:</strong> Tab/Shift+Tab (navigate), Enter (next field), Arrow Up/Down (navigate rows), Ctrl+Enter (submit)
            </Typography>
          </Box>

          {/* Debug info */}
          <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.100' }}>
            <Typography variant="caption">
              Debug: excelEmployeeDialog = {String(excelEmployeeDialog)}
            </Typography>
          </Box>

          {/* Excel-like Table */}
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 'calc(100vh - 300px)', // Use maximum available height
              mb: 2,
              width: '100%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              // 1. General Cell Styling
              '& .MuiTableCell-root': {
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderBottom: 'none',
                borderRight: '1px solid #f0f0f0',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },

              // 2. Header Styling (Orange Color)
              '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableHead-root th': {
                backgroundColor: '#f47c20 !important', // <--- ORANGE COLOR HERE
                color: '#ffffff !important', // White text
                fontWeight: 600,
                textAlign: 'left',
                borderBottom: 'none !important',
                borderTop: 'none !important',
                borderRight: '1px solid rgba(255,255,255,0.15) !important', // Faint white divider
                whiteSpace: 'nowrap',
                padding: '8px 8px', // Slightly more padding for header to look balanced
              },

              // 3. Zebra Striping for Rows
              '& .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root': {
                backgroundColor: '#ffffff',
              },
              '& .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root': {
                backgroundColor: '#fffaf6',
              },
              '& .MuiTableRow-root:hover .MuiTableCell-root': {
                backgroundColor: '#fdf0e6',
              },

              // 4. Invisible Inputs (until focused)
              '& .MuiInputBase-root': {
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #f47c20',
                borderRadius: '2px',
              },
              '& .MuiInputBase-input': {
                padding: '4px 8px !important',
              }
            }}
          >
            <Table
              stickyHeader
              size="small"
              sx={{
                borderCollapse: 'separate',
                borderSpacing: 0,
                width: '100%',
                tableLayout: 'fixed',
                '& .MuiTableCell-root': {
                  border: '1px solid #d4d4d4'
                }
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '40px', textAlign: 'center' }}>S.No</TableCell>
                  <TableCell sx={{ minWidth: 150, width: '17%' }}>Name*</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '13%' }}>Employee Code</TableCell>
                  <TableCell sx={{ minWidth: 180, width: '20%' }}>Email*</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '13%' }}>Department*</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '13%' }}>Position*</TableCell>
                  <TableCell sx={{ minWidth: 120, width: '13%' }}>Deduction</TableCell>
                  <TableCell sx={{ minWidth: 100, width: '11%' }}>Salary*</TableCell>
                  <TableCell sx={{ minWidth: 100, width: '11%' }}>Status</TableCell>
                  <TableCell sx={{ minWidth: 80, width: '4%', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {excelEmployees.map((employee, index) => (
                  <TableRow key={employee.id} hover>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 500, color: '#666' }}>
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={employee.name}
                        onChange={(e) => handleExcelEmployeeChange(employee.id, 'name', e.target.value)}
                        placeholder=""
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={employee.employeeCode || ''}
                        onChange={(e) => handleExcelEmployeeChange(employee.id, 'employeeCode', e.target.value)}
                        placeholder="e.g., EMP001"
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="email"
                        value={employee.email}
                        onChange={(e) => handleExcelEmployeeChange(employee.id, 'email', e.target.value)}
                        placeholder=""
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={employee.department || ''}
                        onChange={(event, newValue) => {
                          // If new department, add it to the list
                          if (newValue && !departments.includes(newValue)) {
                            setDepartments([...departments, newValue]);
                          }
                          handleExcelEmployeeChange(employee.id, 'department', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelEmployeeChange(employee.id, 'department', newInputValue);
                        }}
                        options={departments}
                        filterOptions={(options, params) => {
                          const filtered = options.filter(option =>
                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                          );

                          // Suggest the input value as an option if it's not already in the list
                          if (params.inputValue !== '' && !filtered.includes(params.inputValue)) {
                            filtered.push(params.inputValue);
                          }

                          return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            value={employee.department || ''}
                            required
                            placeholder=""
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={employee.position || ''}
                        onChange={(event, newValue) => {
                          // If new position, add it to the list
                          if (newValue && !positions.includes(newValue)) {
                            setPositions([...positions, newValue]);
                          }
                          handleExcelEmployeeChange(employee.id, 'position', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelEmployeeChange(employee.id, 'position', newInputValue);
                        }}
                        options={positions}
                        filterOptions={(options, params) => {
                          const filtered = options.filter(option =>
                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                          );

                          // Suggest the input value as an option if it's not already in the list
                          if (params.inputValue !== '' && !filtered.includes(params.inputValue)) {
                            filtered.push(params.inputValue);
                          }

                          return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            value={employee.position || ''}
                            required
                            placeholder=""
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={employee.deduction || ''}
                        onChange={(e) => handleExcelEmployeeChange(employee.id, 'deduction', e.target.value)}
                        placeholder="0.00"
                        InputProps={{ startAdornment: '₹' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={employee.salary}
                        onChange={(e) => handleExcelEmployeeChange(employee.id, 'salary', e.target.value)}
                        placeholder="0.00"
                        InputProps={{ startAdornment: '₹' }}
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Autocomplete
                        freeSolo
                        size="small"
                        value={employee.status}
                        onChange={(event, newValue) => {
                          // If new status, add it to the list
                          if (newValue && !['ACTIVE', 'INACTIVE', 'ON_LEAVE'].includes(newValue)) {
                            // We could maintain a separate employeeStatuses state if needed
                          }
                          handleExcelEmployeeChange(employee.id, 'status', newValue);
                        }}
                        onInputChange={(event, newInputValue) => {
                          handleExcelEmployeeChange(employee.id, 'status', newInputValue);
                        }}
                        options={['ACTIVE', 'INACTIVE', 'ON_LEAVE']}
                        filterOptions={(options, params) => {
                          const filtered = options.filter(option =>
                            option.toLowerCase().includes(params.inputValue.toLowerCase())
                          );

                          // Suggest the input value as an option if it's not already in the list
                          if (params.inputValue !== '' && !filtered.includes(params.inputValue)) {
                            filtered.push(params.inputValue);
                          }

                          return filtered;
                        }}
                        selectOnFocus
                        clearOnBlur
                        handleHomeEndKeys
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            size="small"
                            placeholder=""
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveExcelEmployeeRow(employee.id)}
                        color="error"
                        disabled={excelEmployees.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Add Row Button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddExcelEmployeeRow}
              size="small"
            >
              Add New Row
            </Button>
            <Typography variant="caption" color="text.secondary">
              {excelEmployees.length} employee(s) ready to add
            </Typography>
          </Box>

          {/* Summary */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Summary:</strong> {excelEmployees.filter(e => e.name && e.email && e.department && e.position && e.salary).length} complete employee(s) ready to submit.
              Total salary amount: ₹{excelEmployees.reduce((sum, e) => sum + (Number(e.salary) || 0), 0).toLocaleString()}
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExcelEmployeeDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleExcelEmployeeSubmit}
            disabled={addEmployeeMutation.isLoading}
          >
            {addEmployeeMutation.isLoading ? 'Adding...' : `Add ${excelEmployees.filter(e => e.name && e.email && e.department && e.position && e.salary).length} Employees`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Expense' : 'Add New Expense'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  value={form.expense_category}
                  onChange={(event, newValue) => {
                    // If new category, add it to the list
                    if (newValue && !expenseCategories.includes(newValue)) {
                      setExpenseCategories([...expenseCategories, newValue]);
                    }
                    setForm({ ...form, expense_category: newValue });
                  }}
                  options={expenseCategories}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category"
                      required
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={form.expense_description}
                  onChange={(e) => setForm({ ...form, expense_description: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={form.payment_mode}
                    onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    label="Payment Mode"
                  >
                    {paymentModes.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={form.reference_number}
                  onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    label="Status"
                  >
                    {expenseStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tags (comma-separated)"
                  placeholder="e.g., URGENT, BUSINESS, RECURRING"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  helperText="Common tags: URGENT, RECURRING, BUDGET, APPROVED, PERSONAL, BUSINESS"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  size="small"
                  value={form.budget_category}
                  onChange={(event, newValue) => {
                    // If new category, add it to the list
                    if (newValue && !budgetCategoryTypes.includes(newValue)) {
                      setBudgetCategoryTypes([...budgetCategoryTypes, newValue]);
                    }
                    setForm({ ...form, budget_category: newValue });
                  }}
                  options={budgetCategoryTypes}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Budget Category"
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Budget Year</InputLabel>
                  <Select
                    value={form.budget_year}
                    onChange={(e) => setForm({ ...form, budget_year: e.target.value })}
                    label="Budget Year"
                  >
                    {budgetYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Budget Period</InputLabel>
                  <Select
                    value={form.budget_period}
                    onChange={(e) => setForm({ ...form, budget_period: e.target.value })}
                    label="Budget Period"
                  >
                    {budgetPeriods.map((period) => (
                      <MenuItem key={period} value={period}>
                        {period}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Budget Allocated"
                  type="number"
                  value={form.budget_allocated}
                  onChange={(e) => setForm({ ...form, budget_allocated: e.target.value })}
                  helperText="Annual budget allocation for this expense"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Recurring</InputLabel>
                  <Select
                    value={form.is_recurring}
                    onChange={(e) => setForm({ ...form, is_recurring: e.target.value })}
                    label="Recurring"
                  >
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {form.is_recurring && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={form.recurring_frequency}
                      onChange={(e) => setForm({ ...form, recurring_frequency: e.target.value })}
                      label="Frequency"
                    >
                      {recurringFrequencies.map((frequency) => (
                        <MenuItem key={frequency} value={frequency}>
                          {frequency}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingId ? 'Update' : 'Add'} Expense
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Add New Employee</Typography>
        </DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const employeeData = {
            employee_name: formData.get('employee_name'),
            department: formData.get('department'),
            position: formData.get('position'),
            status: formData.get('status'),
            salary: Number(formData.get('salary')),
            hire_date: formData.get('hire_date'),
            email: formData.get('email'),
            phone: formData.get('phone')
          };
          addEmployeeMutation.mutate(employeeData);
        }}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee Name"
                  name="employee_name"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" label="Status" defaultValue="Active">
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  name="salary"
                  type="number"
                  required
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hire Date"
                  name="hire_date"
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={addEmployeeMutation.isLoading}
            >
              {addEmployeeMutation.isLoading ? 'Adding...' : 'Add Employee'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6">Edit Employee</Typography>
        </DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const employeeData = {
            id: selectedEmployee?.id,
            employee_name: formData.get('employee_name') || selectedEmployee?.employee_name,
            department: formData.get('department') || selectedEmployee?.department,
            position: formData.get('position') || selectedEmployee?.position,
            status: formData.get('status') || selectedEmployee?.status,
            salary: Number(formData.get('salary') || selectedEmployee?.salary),
            hire_date: formData.get('hire_date') || selectedEmployee?.hire_date,
            email: formData.get('email') || selectedEmployee?.email,
            phone: formData.get('phone') || selectedEmployee?.phone
          };
          updateEmployeeMutation.mutate(employeeData);
        }}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Employee Name"
                  name="employee_name"
                  defaultValue={selectedEmployee?.employee_name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  name="department"
                  defaultValue={selectedEmployee?.department}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  defaultValue={selectedEmployee?.position}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select name="status" label="Status" defaultValue={selectedEmployee?.status || 'Active'}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  name="salary"
                  type="number"
                  defaultValue={selectedEmployee?.salary}
                  required
                  InputProps={{ startAdornment: '₹' }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hire Date"
                  name="hire_date"
                  type="date"
                  defaultValue={selectedEmployee?.hire_date}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={selectedEmployee?.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  defaultValue={selectedEmployee?.phone}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={updateEmployeeMutation.isLoading}
            >
              {updateEmployeeMutation.isLoading ? 'Updating...' : 'Update Employee'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Enhanced History Dialog with Search, Filters, and Enhanced Table */}
      <Dialog open={showHistory} onClose={() => setShowHistory(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History />
          Expense History - {fromYear} to {toYear}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing all expenses from selected budget period ({fromYear}-{toYear})
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={dateFilter.fromDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, fromDate: e.target.value })}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={dateFilter.toDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, toDate: e.target.value })}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setDateFilter({ fromDate: '', toDate: '' });
                      setSearch('');
                    }}
                    startIcon={<Search />}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Enhanced Stats Cards - Same as Overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Receipt sx={{ color: '#1976d2' }} />
                    <Typography variant="h6" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#1976d2">
                    ₹{historyStats.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fromYear} to {toYear}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TrendingUp sx={{ color: '#2f9e44' }} />
                    <Typography variant="h6" color="text.secondary">
                      Monthly Average
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#2f9e44">
                    ₹{Math.round(historyStats.thisMonthAmount / 30).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daily average
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Category sx={{ color: '#f58a07' }} />
                    <Typography variant="h6" color="text.secondary">
                      Categories
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#f58a07">
                    {Object.keys(historyStats.categoryBreakdown).length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ color: '#d32f2f' }} />
                    <Typography variant="h6" color="text.secondary">
                      This Month
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight={700} color="#d32f2f">
                    {format(new Date(), 'MMM yyyy')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current period
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Quick Insights - Same as Overview */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp />
                    Top Categories
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(historyStats.categoryBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 3)
                      .map(([category, amount]) => (
                        <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Category fontSize="small" />
                            <Typography variant="body2">{category}</Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday />
                    Recent Activity
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {(() => {
                      return filteredExpenses.slice(0, 3).map((expense) => (
                        <Box key={expense.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{getExpenseCategoryValue(expense)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(() => {
                                const dt = toValidDate(getExpenseDateValue(expense));
                                return dt ? format(dt, 'MMM dd') : '-';
                              })()}
                            </Typography>
                          </Box>
                          <Typography variant="h6" color="primary">
                            ₹{expense.amount.toLocaleString()}
                          </Typography>
                        </Box>
                      ));
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Enhanced History Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment Mode</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  return filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>
                        {(() => {
                          const dt = toValidDate(getExpenseDateValue(expense));
                          return dt ? format(dt, 'dd-MM-yyyy') : '-';
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getExpenseCategoryValue(expense)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getExpenseDescriptionValue(expense)}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        ₹{Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={expense.status}
                          size="small"
                          color={
                            expense.status === 'PAID' ? 'success' :
                              expense.status === 'PENDING' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{expense.payment_mode}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(expense)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(expense.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHistory(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={() => {
              handleExport('csv');
            }}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
      {/* Salary Details Dialog */}
      <Dialog
        open={salaryDetailsDialog}
        onClose={() => setSalaryDetailsDialog(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            height: '95vh',
            maxHeight: '95vh',
            margin: 2,
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <AttachMoney />
          <Typography variant="h5">Salary Details Management</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            label={`${getFilteredEmployees().length} Employees`}
            color="primary"
            size="small"
          />
        </DialogTitle>
        <DialogContent sx={{ p: 2, height: 'calc(95vh - 140px)', overflow: 'hidden' }}>
          {/* View Mode Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Employee Salary Overview</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant={salaryViewMode === 'monthly' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSalaryViewMode('monthly')}
              >
                Monthly View
              </Button>
              <Button
                variant={salaryViewMode === 'yearly' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSalaryViewMode('yearly')}
              >
                Yearly View
              </Button>
            </Box>
          </Box>

          {/* Year and Month Filters */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle2">Filter by:</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Year"
              >
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {salaryViewMode === 'monthly' && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                    <MenuItem key={index} value={index}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSelectedYear(new Date().getFullYear());
                setSelectedMonth(new Date().getMonth());
              }}
            >
              Current Period
            </Button>

            <Box sx={{ flexGrow: 1 }} />

            {/* Summary Cards */}
            <Card sx={{ minWidth: 200, bgcolor: 'primary.50' }}>
              <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  {salaryViewMode === 'monthly' ? 'Monthly Total' : 'Yearly Total'}
                </Typography>
                <Typography variant="h6" color="primary">
                  ₹{(calculateSalaryTotals().totalSalary).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Employee Salary Table - EXCEL STYLED */}
          <TableContainer
            component={Paper}
            sx={{
              height: 'calc(95vh - 320px)',
              mb: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              // 1. General Cell Styling
              '& .MuiTableCell-root': {
                padding: '6px 10px',
                fontSize: '0.8rem',
                borderBottom: 'none',
                borderRight: '1px solid #f0f0f0',
              },
              '& .MuiTableCell-root:last-child': {
                borderRight: 'none',
              },

              // 2. Header Styling (Orange)
              '& .MuiTableHead-root .MuiTableCell-root, & .MuiTableHead-root th': {
                backgroundColor: '#f47c20 !important', // Orange
                color: '#ffffff !important', // White text
                fontWeight: 600,
                textAlign: 'left',
                borderBottom: 'none !important',
                borderTop: 'none !important',
                borderRight: '1px solid rgba(255,255,255,0.15) !important', // Faint white divider
                whiteSpace: 'nowrap',
                padding: '8px 8px',
              },

              // 3. Zebra Striping for Rows
              '& .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root': {
                backgroundColor: '#ffffff',
              },
              '& .MuiTableRow-root:nth-of-type(even) .MuiTableCell-root': {
                backgroundColor: '#f8fafc', // Very subtle cool gray/blue tint for contrast
              },
              '& .MuiTableRow-root:hover .MuiTableCell-root': {
                backgroundColor: '#f1f5f9', // Slightly darker on hover
              },

              // 4. Invisible Inputs (until focused)
              '& .MuiInputBase-root': {
                fontSize: '0.75rem',
                backgroundColor: 'transparent',
                padding: 0,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none',
              },
              '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: '1px solid #374151', // Focus border matches the dark header
                borderRadius: '2px',
              },
              '& .MuiInputBase-input': {
                padding: '4px 8px !important',
              }
            }}
          >
            <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 50, textAlign: 'center' }}>S.No</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Name</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Employee Code</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>Department</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Total Salary</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Deduction</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Total Days as per month</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Total Day Present</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Net Amount</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>OT (if applicable)</TableCell>
                  <TableCell sx={{ minWidth: 90, textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Combine existing employees and new empty rows */}
                {[...(editableEmployees || []), ...newEmployeeRows].map((employee, index) => {
                  const salaryCalc = calculateMonthlySalary({
                    salary: Number(employee.salary) || 0,
                    total_days_per_month: resolveEmployeeMonthDays(),
                    total_day_present: Number(employee.total_day_present) || 0
                  });
                  return (
                    <TableRow key={employee.id} hover>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 500, color: '#666' }}>
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            value={employee.employee_name}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, employee_name: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}

                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={employee.employee_name || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, employee_name: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder=""
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            value={employee.employee_code || ''}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, employee_code: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}

                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={employee.employee_code || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, employee_code: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder=""
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            value={employee.department || ''}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, department: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}

                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            value={employee.department || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, department: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder=""
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.salary || ''}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, salary: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}
                            placeholder="0"
                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.salary || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, salary: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder="0"
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={salaryCalc.reduction}
                          disabled
                          sx={{
                            width: '100%',
                            '& .MuiInputBase-input.Mui-disabled': {
                              color: '#000',
                              WebkitTextFillColor: '#000'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={resolveEmployeeMonthDays(employee)}
                            disabled
                            sx={{
                              width: '100%',
                              '& .MuiInputBase-input.Mui-disabled': {
                              color: '#000',
                              WebkitTextFillColor: '#000'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.total_day_present || ''}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, total_day_present: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}
                            placeholder="0"
                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.total_day_present || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, total_day_present: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder="0"
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'success.main' }}>
                          ₹{salaryCalc.inHandSalary.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {employee.isNew ? (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.ot || ''}
                            onChange={(e) => {
                              const updatedNewRows = newEmployeeRows.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, ot: e.target.value }
                                  : emp
                              );
                              setNewEmployeeRows(updatedNewRows);
                            }}

                            sx={{ width: '100%' }}
                          />
                        ) : (
                          <TextField
                            size="small"
                            type="number"
                            value={employee.ot || ''}
                            onChange={(e) => {
                              const updatedEmployees = editableEmployees.map(emp =>
                                emp.id === employee.id
                                  ? { ...emp, ot: e.target.value }
                                  : emp
                              );
                              setEditableEmployees(updatedEmployees);
                            }}
                            placeholder="0"
                            sx={{ width: '100%' }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {employee.isNew ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => {
                                // Clear the new row
                                const updatedNewRows = newEmployeeRows.filter(emp => emp.id !== employee.id);
                                setNewEmployeeRows(updatedNewRows);
                              }}
                              sx={{
                                minWidth: 'auto',
                                padding: '2px 8px',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                borderColor: '#d1d5db',
                                color: '#374151',
                                '&:hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }
                              }}
                            >
                              Clear
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Edit sx={{ fontSize: '1rem !important' }} />}
                              onClick={() => {
                                // Enable editing for this employee
                                const updatedEmployees = editableEmployees.map(emp =>
                                  emp.id === employee.id
                                    ? { ...emp, isEditing: true }
                                    : emp
                                );
                                setEditableEmployees(updatedEmployees);
                              }}
                              sx={{
                                minWidth: 'auto',
                                padding: '2px 8px',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                borderColor: '#d1d5db',
                                color: '#374151',
                                '&:hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<Visibility sx={{ fontSize: '1rem !important' }} />}
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setEmployeeDetailsDialog(true);
                                setSelectedYear(new Date().getFullYear());
                                setSelectedMonth(new Date().getMonth());
                              }}
                              sx={{
                                minWidth: 'auto',
                                padding: '2px 8px',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                borderColor: '#d1d5db',
                                color: '#374151',
                                '&:hover': { backgroundColor: '#f3f4f6', borderColor: '#9ca3af' }
                              }}
                            >
                              View
                            </Button>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Alert severity="info" sx={{ flex: 1, mr: 2 }}>
              <Typography variant="body2">
                <strong>Summary:</strong> {getFilteredSummary().totalEmployees} employees
                {getFilteredSummary().totalEmployees > 0 && (
                  <>
                    {' '} | {getFilteredSummary().period}
                    <br />
                    {salaryViewMode === 'monthly' ? (
                      <>
                        Total Monthly Payout: ₹{(getFilteredSummary().totalMonthly || 0).toLocaleString()}
                        {' '} | Total Yearly Payout: ₹{(getFilteredSummary().totalYearly || 0).toLocaleString()}
                      </>
                    ) : (
                      <>
                        Total Yearly Payout: ₹{(getFilteredSummary().totalYearly || 0).toLocaleString()}
                        {' '} | Average Monthly: ₹{(getFilteredSummary().avgMonthly || 0).toLocaleString()}
                      </>
                    )}
                  </>
                )}
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalaryDetailsDialog(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              // Reset new rows to show 20 empty rows
              setNewEmployeeRows(Array.from({ length: 20 }, (_, index) => ({
                id: `new-${index}`,
                employee_name: '',
                email: '',
                phone: '',
                department: '',
                position: '',
                salary: '',
                reduction: '',
                totalDays: '',
                marginDays: '',
                status: 'ACTIVE',
                isNew: true
              })));
            }}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={async () => {
              const existingEmployeesToUpdate = (editableEmployees || [])
                .filter(emp => !emp.isNew)
                .map(emp => {
                  const id = emp.id || emp._id;
                  const salaryCalc = calculateMonthlySalary({
                    salary: Number(emp.salary) || 0,
                    total_days_per_month: resolveEmployeeMonthDays(),
                    total_day_present: Number(emp.total_day_present || 0),
                  });
                  return {
                    id,
                    employee_name: emp.employee_name || emp.name || 'Unknown',
                    employee_code: emp.employee_code || emp.employeeCode || '',
                    email: emp.email || '',
                    phone: emp.phone || '',
                    department: emp.department || '',
                    position: emp.position || '',
                    salary: Number(emp.salary) || 0,
                    reduction: Number(salaryCalc.reduction || 0),
                    ot: Number(emp.ot) || 0,
                    total_days_per_month: Number(resolveEmployeeMonthDays()),
                    total_day_present: Number(emp.total_day_present || 0),
                    status: emp.status || 'ACTIVE',
                    hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
                  };
                })
                .filter(emp => emp.id);

              const newEmployeesToCreate = newEmployeeRows
                .filter(emp => emp.employee_name || emp.employee_code || emp.department || emp.salary || emp.reduction || emp.ot)
                .map(emp => {
                  const salaryCalc = calculateMonthlySalary({
                    salary: Number(emp.salary) || 0,
                    total_days_per_month: resolveEmployeeMonthDays(),
                    total_day_present: Number(emp.total_day_present || 0),
                  });
                  return {
                    name: emp.employee_name || 'Unknown',
                    employee_name: emp.employee_name || 'Unknown',
                    employee_code: emp.employee_code || '',
                    email: emp.email || '',
                    phone: emp.phone || '',
                    department: emp.department || '',
                    position: emp.position || '',
                    salary: Number(emp.salary) || 0,
                    reduction: Number(salaryCalc.reduction || 0),
                    ot: Number(emp.ot) || 0,
                    total_days_per_month: Number(resolveEmployeeMonthDays()),
                    total_day_present: Number(emp.total_day_present || 0),
                    status: (emp.status || 'ACTIVE').toUpperCase(),
                    hire_date: emp.hire_date || new Date().toISOString().split('T')[0],
                  };
                });

              const totalOperations = existingEmployeesToUpdate.length + newEmployeesToCreate.length;
              if (totalOperations === 0) {
                toast('No employee data to save');
                return;
              }

              try {
                const updateOps = existingEmployeesToUpdate.map(emp =>
                  reportsAPI.updateEmployee(emp)
                );
                const createOps = newEmployeesToCreate.map(emp =>
                  reportsAPI.addEmployee(emp)
                );
                const results = await Promise.allSettled([...updateOps, ...createOps]);
                const successCount = results.filter(r => r.status === 'fulfilled').length;
                const failCount = results.length - successCount;

                queryClient.invalidateQueries(['employees']);
                queryClient.invalidateQueries(['salary']);

                if (failCount === 0) {
                  toast.success(`${successCount} employee record(s) saved successfully!`);
                  setNewEmployeeRows([]);
                } else {
                  toast.error(`${failCount} failed, ${successCount} saved successfully`);
                }
              } catch (error) {
                console.error('Error saving salary details:', error);
                toast.error('Failed to save employee salary details');
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      {/* Employee Details Dialog */}
      <Dialog open={employeeDetailsDialog} onClose={() => setEmployeeDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person />
          Employee Salary Details - {selectedEmployee?.employee_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Detailed salary breakdown for {selectedEmployee?.employee_name}
            </Typography>
          </Box>

          {/* View Mode Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Salary Breakdown</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={employeeDetailsViewMode === 'monthly' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEmployeeDetailsViewMode('monthly')}
              >
                Monthly View
              </Button>
              <Button
                variant={employeeDetailsViewMode === 'yearly' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEmployeeDetailsViewMode('yearly')}
              >
                Yearly View
              </Button>
            </Box>
          </Box>

          {selectedEmployee && (
            <>
              {employeeDetailsViewMode === 'monthly' ? (
                // Monthly View
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Basic Salary</Typography>
                      <Typography variant="h6">₹{calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0
                      }).monthlySalary.toLocaleString()}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Deductions</Typography>
                      <Typography variant="h6" color="error.main">-₹{calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0
                      }).reduction.toLocaleString()}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Net Salary</Typography>
                      <Typography variant="h6" color="success.main">{calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).hasAttendance ? `₹${calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).inHandSalary.toLocaleString()}` : ''}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Working Days</Typography>
                      <Typography variant="h6">{resolveEmployeeMonthDays(selectedEmployee)} days</Typography>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                // Yearly View
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Yearly Gross</Typography>
                      <Typography variant="h6">{calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).hasAttendance ? `₹${calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).yearlySalary.toLocaleString()}` : ''}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Yearly Deductions</Typography>
                      <Typography variant="h6" color="error.main">-₹{(calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0
                      }).reduction * 12).toLocaleString()}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Yearly Net</Typography>
                      <Typography variant="h6" color="success.main">{(calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).hasAttendance ? `₹${(calculateMonthlySalary({
                        salary: Number(selectedEmployee?.salary) || 0,
                        reduction: Number(selectedEmployee?.reduction) || 0,
                        total_day_present: Number(selectedEmployee?.total_day_present) || 0
                      }).inHandSalary * 12).toLocaleString()}` : '')}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Total Work Days</Typography>
                      <Typography variant="h6">{resolveEmployeeMonthDays(selectedEmployee) * 12} days</Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Employee Info */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Employee Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Name:</strong> {selectedEmployee.employee_name}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedEmployee.email}</Typography>
                    <Typography variant="body2"><strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Department:</strong> {selectedEmployee.department}</Typography>
                    <Typography variant="body2"><strong>Position:</strong> {selectedEmployee.position}</Typography>
                    <Typography variant="body2"><strong>Status:</strong> {selectedEmployee.status}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmployeeDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Budget Period Dialog */}
      <Dialog open={addBudgetPeriodDialog} onClose={() => setAddBudgetPeriodDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Category />
          Add New Budget Period
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Budget Period"
            type="text"
            fullWidth
            variant="outlined"
            placeholder="e.g., 2027-2028"
            value={newBudgetPeriod}
            onChange={(e) => setNewBudgetPeriod(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBudgetPeriodDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddBudgetPeriod}
            variant="contained"
            disabled={addBudgetPeriodMutation.isLoading}
          >
            {addBudgetPeriodMutation.isLoading ? 'Adding...' : 'Add Period'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GeneralExpense;
