import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  AccountBalance,
  PictureAsPdf,
  People,
  ShoppingCart,
  Inventory,
  Receipt,
  Business,
  AttachMoney,
  Group,
  BarChart,
  Today,
  Payments,
  AccountBalanceWallet,
  Person,
  Download,
  TableChart,
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// --- MOCK DATA FOR TESTING ---
const mockMonthlyData = [
  { month: 'Jan', sales: 420000, bills: 120, purchase: 280000, profit: 140000 },
  { month: 'Feb', sales: 450000, bills: 135, purchase: 300000, profit: 150000 },
  { month: 'Mar', sales: 480000, bills: 142, purchase: 310000, profit: 170000 },
  { month: 'Apr', sales: 510000, bills: 156, purchase: 320000, profit: 190000 },
  { month: 'May', sales: 490000, bills: 148, purchase: 315000, profit: 175000 },
  { month: 'Jun', sales: 530000, bills: 165, purchase: 340000, profit: 190000 },
  { month: 'Jul', sales: 580000, bills: 180, purchase: 360000, profit: 220000 },
  { month: 'Aug', sales: 610000, bills: 192, purchase: 380000, profit: 230000 },
  { month: 'Sep', sales: 590000, bills: 185, purchase: 370000, profit: 220000 },
  { month: 'Oct', sales: 650000, bills: 210, purchase: 410000, profit: 240000 },
  { month: 'Nov', sales: 720000, bills: 235, purchase: 450000, profit: 270000 },
  { month: 'Dec', sales: 780000, bills: 250, purchase: 480000, profit: 300000 },
];

const mockProducts = [
  { product_id: 1, product_name: 'Premium Widget A', category: 'Electronics', quantity_sold: 450, revenue: 850000, cost: 500000, profit: 350000, margin_pct: 41.1 },
  { product_id: 2, product_name: 'Super Gadget B', category: 'Electronics', quantity_sold: 820, revenue: 620000, cost: 400000, profit: 220000, margin_pct: 35.4 },
  { product_id: 3, product_name: 'Office Chair Pro', category: 'Furniture', quantity_sold: 210, revenue: 420000, cost: 250000, profit: 170000, margin_pct: 40.4 },
  { product_id: 4, product_name: 'Ergo Mouse', category: 'Accessories', quantity_sold: 1200, revenue: 360000, cost: 180000, profit: 180000, margin_pct: 50.0 },
  { product_id: 5, product_name: 'Mechanical Keyboard', category: 'Accessories', quantity_sold: 950, revenue: 285000, cost: 150000, profit: 135000, margin_pct: 47.3 },
  { product_id: 6, product_name: 'Standing Desk Max', category: 'Furniture', quantity_sold: 85, revenue: 510000, cost: 350000, profit: 160000, margin_pct: 31.3 },
  { product_id: 7, product_name: 'USB-C Hub', category: 'Accessories', quantity_sold: 2400, revenue: 120000, cost: 50000, profit: 70000, margin_pct: 58.3 },
  { product_id: 8, product_name: 'Monitor 27"', category: 'Electronics', quantity_sold: 310, revenue: 775000, cost: 550000, profit: 225000, margin_pct: 29.0 },
  { product_id: 9, product_name: 'Old Printer (Dead)', category: 'Electronics', quantity_sold: 0, revenue: 0, cost: 45000, profit: -45000, margin_pct: 0 },
];

const mockCustomers = [
  { key: 1, customer_id: 101, customer_name: 'Acme Corp', total_purchase: 1250000, total_bills: 24, total_quantity: 450, total_due: 45000, total_paid: 1205000, profit: 420000, margin_pct: 33.6 },
  { key: 2, customer_id: 102, customer_name: 'Tech Solutions Inc', total_purchase: 850000, total_bills: 18, total_quantity: 320, total_due: 0, total_paid: 850000, profit: 280000, margin_pct: 32.9 },
  { key: 3, customer_id: 103, customer_name: 'Global Enterprises', total_purchase: 620000, total_bills: 12, total_quantity: 210, total_due: 120000, total_paid: 500000, profit: 190000, margin_pct: 30.6 },
  { key: 4, customer_id: 104, customer_name: 'StartUp Hub', total_purchase: 340000, total_bills: 8, total_quantity: 145, total_due: 0, total_paid: 340000, profit: 110000, margin_pct: 32.3 },
  { key: 5, customer_id: 105, customer_name: 'Local Store', total_purchase: 120000, total_bills: 4, total_quantity: 60, total_due: 15000, total_paid: 105000, profit: 45000, margin_pct: 37.5 },
  { key: 6, customer_id: 106, customer_name: 'Freelancer Bob', total_purchase: 45000, total_bills: 2, total_quantity: 12, total_due: 0, total_paid: 45000, profit: 18000, margin_pct: 40.0 },
  { key: 7, customer_id: 107, customer_name: 'Design Studio', total_purchase: 210000, total_bills: 6, total_quantity: 85, total_due: 0, total_paid: 210000, profit: 75000, margin_pct: 35.7 },
  { key: 8, customer_id: 108, customer_name: 'One-Time Buyer', total_purchase: 15000, total_bills: 1, total_quantity: 3, total_due: 0, total_paid: 15000, profit: 5000, margin_pct: 33.3 },
];

const mockDepartments = [
  { department: 'Sales', employee_count: 12, total_employees: 12, active_employees: 11, new_hires: 2, total_salary: 850000, average_salary: 70833 },
  { department: 'Engineering', employee_count: 25, total_employees: 25, active_employees: 24, new_hires: 4, total_salary: 2450000, average_salary: 98000 },
  { department: 'Marketing', employee_count: 8, total_employees: 8, active_employees: 8, new_hires: 1, total_salary: 520000, average_salary: 65000 },
  { department: 'HR & Admin', employee_count: 5, total_employees: 5, active_employees: 5, new_hires: 0, total_salary: 310000, average_salary: 62000 },
  { department: 'Support', employee_count: 15, total_employees: 15, active_employees: 13, new_hires: 3, total_salary: 600000, average_salary: 40000 },
];

const mockInventory = [
  { item_id: 1, item_name: 'Premium Widget A', stock: 120, min_stock_level: 40, stock_value: 360000, days_in_stock: 15 },
  { item_id: 2, item_name: 'Super Gadget B', stock: 45, min_stock_level: 50, stock_value: 90000, days_in_stock: 25 },
  { item_id: 3, item_name: 'Office Chair Pro', stock: 12, min_stock_level: 15, stock_value: 120000, days_in_stock: 45 },
  { item_id: 4, item_name: 'Ergo Mouse', stock: 350, min_stock_level: 100, stock_value: 175000, days_in_stock: 12 },
  { item_id: 5, item_name: 'Mechanical Keyboard', stock: 8, min_stock_level: 40, stock_value: 32000, days_in_stock: 8 },
  { item_id: 6, item_name: 'Standing Desk Max', stock: 55, min_stock_level: 10, stock_value: 1650000, days_in_stock: 65 },
  { item_id: 7, item_name: 'USB-C Hub', stock: 520, min_stock_level: 150, stock_value: 104000, days_in_stock: 5 },
  { item_id: 8, item_name: 'Monitor 27"', stock: 4, min_stock_level: 20, stock_value: 48000, days_in_stock: 14 },
  { item_id: 9, item_name: 'Old Printer (Dead)', stock: 0, min_stock_level: 5, stock_value: 0, days_in_stock: 210 },
  { item_id: 10, item_name: 'Legacy Cable', stock: 450, min_stock_level: 50, stock_value: 22500, days_in_stock: 195 },
];

const mockData = {
  salesData: { data: { summary: { total_sales: 6810000, total_bills: 2118 }, monthly: mockMonthlyData, products: mockProducts } },
  taxData: { data: { summary: { output_tax: 1225800, net_tax_payable: 450200, taxable_sales: 6810000 } } },
  customerData: { data: { customers: mockCustomers } },
  supplierData: { data: { suppliers: [
    { key: 1, supplier_name: 'Tech Parts Ltd', total_bills: 45, total_purchase: 2100000, total_paid: 1900000, total_due: 200000 },
    { key: 2, supplier_name: 'Global Furnishings', total_bills: 12, total_purchase: 850000, total_paid: 850000, total_due: 0 },
    { key: 3, supplier_name: 'Accessory Hub', total_bills: 85, total_purchase: 1250000, total_paid: 1100000, total_due: 150000 },
    { key: 4, supplier_name: 'Office Supplies Co', total_bills: 18, total_purchase: 120000, total_paid: 90000, total_due: 30000 },
  ] } },
  pnlData: { data: { summary: { sales_amount: 6810000, purchase_amount: 4320000, gross_profit: 2490000, net_profit: 1842500 }, monthly: mockMonthlyData, products: mockProducts, customers: mockCustomers, orders: Array(50).fill({ profit: 1200, revenue: 5000 }) } },
  dayData: { data: { sales_amount: 45000, purchase_amount: 12000, customer_collections: 38000, supplier_payments: 15000 } },
  expenseData: { data: { summary: { total_expenses: 647500, operating_expenses: 420000, administrative_expenses: 150000, other_expenses: 77500 }, expenses: [
    { category: 'Rent', amount: 150000 }, { category: 'Utilities', amount: 45000 }, { category: 'Software Licenses', amount: 85000 }, { category: 'Marketing', amount: 120000 }, { category: 'Travel', amount: 65000 }, { category: 'Office Supplies', amount: 35000 }, { category: 'Maintenance', amount: 147500 }
  ] } },
  salaryData: { data: { summary: { total_salary: 4730000, total_employees: 65, average_salary: 72769, current_month_salary: 4730000 }, departments: mockDepartments } },
  cashFlowData: { data: { summary: { total_inflow: 5420000, total_outflow: 4850000, net_cash_flow: 570000, opening_balance: 1250000 }, transactions: [
    { id: 1, date: '2023-10-01', type: 'Inflow', description: 'Customer Payment - Acme', amount: 125000, balance: 1375000 },
    { id: 2, date: '2023-10-02', type: 'Outflow', description: 'Supplier Payment - Tech Parts', amount: 50000, balance: 1325000 },
    { id: 3, date: '2023-10-03', type: 'Outflow', description: 'Office Rent', amount: 150000, balance: 1175000 },
    { id: 4, date: '2023-10-05', type: 'Inflow', description: 'Daily Sales', amount: 45000, balance: 1220000 },
    { id: 5, date: '2023-10-06', type: 'Inflow', description: 'Customer Payment - Global', amount: 85000, balance: 1305000 },
  ] } },
  employeeData: { data: { summary: { total_employees: 65, active_employees: 61, new_hires: 10, attrition_rate: 6.1, training_cost: 120000, productivity_gain: 450000 }, salesTeam: [
    { employee_id: 1, employee_name: 'John Doe', sales_target: 500000, sales_achieved: 550000 },
    { employee_id: 2, employee_name: 'Jane Smith', sales_target: 600000, sales_achieved: 580000 },
    { employee_id: 3, employee_name: 'Mike Johnson', sales_target: 450000, sales_achieved: 480000 },
    { employee_id: 4, employee_name: 'Sarah Williams', sales_target: 700000, sales_achieved: 620000 },
    { employee_id: 5, employee_name: 'Chris Lee', sales_target: 400000, sales_achieved: 410000 },
  ], monthlyPerformance: [
    { month: 'Jul', target_sales: 2400000, actual_sales: 2500000 },
    { month: 'Aug', target_sales: 2500000, actual_sales: 2650000 },
    { month: 'Sep', target_sales: 2600000, actual_sales: 2450000 },
    { month: 'Oct', target_sales: 2700000, actual_sales: 2800000 },
    { month: 'Nov', target_sales: 2800000, actual_sales: 2950000 },
    { month: 'Dec', target_sales: 3000000, actual_sales: 3100000 },
  ], departments: mockDepartments } },
  inventoryData: { data: { stockItems: mockInventory } },
};
// -----------------------------

const money = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
  });
  
  const [dayDate, setDayDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Use Mock Data directly (bypassing react-query completely for testing)
  const salesData = mockData.salesData;
  const taxData = mockData.taxData;
  const customerData = mockData.customerData;
  const supplierData = mockData.supplierData;
  const pnlData = mockData.pnlData;
  const dayData = mockData.dayData;
  const expenseData = mockData.expenseData;
  const salaryData = mockData.salaryData;
  const cashFlowData = mockData.cashFlowData;
  const employeeData = mockData.employeeData;
  const inventoryData = mockData.inventoryData;

  // Set all loading states to false since data is synchronous
  const salesLoading = false;
  const taxLoading = false;
  const customerLoading = false;
  const supplierLoading = false;
  const pnlLoading = false;
  const dayLoading = false;
  const expenseLoading = false;
  const salaryLoading = false;
  const cashFlowLoading = false;
  const employeeLoading = false;
  const inventoryLoading = false;
  
  // Excel export functions
  const exportToExcel = (data, filename) => {
    let csvContent = '';
    if (Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      csvContent += headers.join(',') + '\n';
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportSalesData = () => {
    if (salesData?.data) {
      const exportData = [
        { 
          'Report Type': 'Sales Summary',
          'Total Sales': salesData.data.summary?.total_sales || 0,
          'Total Bills': salesData.data.summary?.total_bills || 0,
          'Average Bill Value': salesData.data.summary?.total_sales / Math.max(salesData.data.summary?.total_bills || 1, 1),
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {}, 
        ...salesData.data.products?.map(p => ({
          'Product Name': p.product_name,
          'Category': p.category || 'N/A',
          'Quantity Sold': p.quantity_sold || 0,
          'Revenue': p.revenue || 0,
          'Average Price': (p.quantity_sold || 0) > 0 ? (p.revenue || 0) / p.quantity_sold : 0
        })) || [],
        {}, 
        ...salesData.data.monthly?.map(m => ({
          'Month': m.month,
          'Sales': m.sales || 0,
          'Bills': m.bills || 0,
          'Average Bill': (m.bills || 0) > 0 ? (m.sales || 0) / m.bills : 0
        })) || []
      ];
      exportToExcel(exportData, `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const exportCustomerData = () => {
    if (customerData?.data) {
      const exportData = [
        { 
          'Report Type': 'Customer Analysis',
          'Total Customers': customerData.data.customers?.length || 0,
          'Total Revenue': customerData.data.customers?.reduce((sum, c) => sum + (c.total_purchase || 0), 0) || 0,
          'Average Customer Value': customerData.data.customers?.length > 0 ? 
            customerData.data.customers.reduce((sum, c) => sum + (c.total_purchase || 0), 0) / customerData.data.customers.length : 0,
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {},
        ...customerData.data.customers?.map(c => ({
          'Customer Name': c.customer_name,
          'Total Purchase': c.total_purchase || 0,
          'Total Bills': c.total_bills || 0,
          'Average Order Value': (c.total_bills || 0) > 0 ? (c.total_purchase || 0) / c.total_bills : 0,
          'Total Quantity': c.total_quantity || 0,
          'Customer Type': (c.total_bills || 0) > 1 ? 'Returning' : 'New',
          'Customer Segment': (c.total_purchase || 0) > 100000 ? 'High Value' : 
                           (c.total_purchase || 0) > 50000 ? 'Medium Value' : 'Low Value'
        })) || []
      ];
      exportToExcel(exportData, `Customer_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const exportProfitData = () => {
    if (pnlData?.data) {
      const exportData = [
        { 
          'Report Type': 'Profit & Loss Analysis',
          'Total Sales': pnlData.data.summary?.sales_amount || 0,
          'Total Purchases': pnlData.data.summary?.purchase_amount || 0,
          'Gross Profit': pnlData.data.summary?.gross_profit || 500000,
          'Net Profit': pnlData.data.summary?.net_profit || pnlData.data.summary?.gross_profit || 0,
          'Gross Margin': pnlData.data.summary?.sales_amount > 0 ? 
            ((pnlData.data.summary?.gross_profit || 0) / pnlData.data.summary?.sales_amount * 100) : 0,
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {},
        ...pnlData.data.monthly?.map(m => ({
          'Month': m.month,
          'Sales': m.sales || 0,
          'Purchases': m.purchases || 0,
          'Gross Profit': m.profit || 0,
          'Net Profit': (m.profit || 0) * 0.85, 
          'Gross Margin %': m.sales > 0 ? ((m.profit || 0) / m.sales * 100) : 0,
          'Net Margin %': m.sales > 0 ? (((m.profit || 0) * 0.85) / m.sales * 100) : 0
        })) || []
      ];
      exportToExcel(exportData, `Profit_Loss_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const exportInventoryData = () => {
    if (inventoryData?.data) {
      const exportData = [
        { 
          'Report Type': 'Inventory Analysis',
          'Total Products': inventoryData.data.stockItems?.length || 0,
          'Total Inventory Value': inventoryData.data.stockItems?.reduce((sum, i) => sum + (i.stock_value || 0), 0) || 0,
          'Fast Moving Items': inventoryData.data.stockItems?.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2).length || 0,
          'Slow Moving Items': inventoryData.data.stockItems?.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0)).length || 0,
          'Dead Stock Items': inventoryData.data.stockItems?.filter(i => (i.stock || 0) === 0).length || 0,
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {},
        ...inventoryData.data.stockItems?.map(item => {
          const stockRatio = (item.stock || 0) / Math.max(item.min_stock_level || 1, 1);
          return {
            'Item Name': item.item_name,
            'Current Stock': item.stock || 0,
            'Minimum Stock Level': item.min_stock_level || 0,
            'Stock Ratio': stockRatio.toFixed(2),
            'Stock Value': item.stock_value || 0,
            'Movement Status': (item.stock || 0) === 0 ? 'Dead Stock' :
                           (item.stock || 0) > (item.min_stock_level || 0) * 2 ? 'Fast Moving' :
                           (item.stock || 0) > 0 && (item.stock || 0) <= (item.min_stock_level || 0) ? 'Slow Moving' : 'Normal',
            'Reorder Priority': (item.stock || 0) === 0 ? 'Urgent' :
                               (item.stock || 0) < (item.min_stock_level || 0) * 0.5 ? 'High' :
                               (item.stock || 0) < (item.min_stock_level || 0) ? 'Medium' : 'Normal'
          };
        }) || []
      ];
      exportToExcel(exportData, `Inventory_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const exportEmployeeData = () => {
    if (employeeData?.data) {
      const exportData = [
        { 
          'Report Type': 'Employee Performance Analysis',
          'Total Employees': employeeData.data.summary?.total_employees || 0,
          'Active Employees': employeeData.data.summary?.active_employees || 0,
          'New Hires': employeeData.data.summary?.new_hires || 0,
          'Attrition Rate': employeeData.data.summary?.attrition_rate || 0,
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {},
        ...employeeData.data.departments?.map(d => ({
          'Department': d.department,
          'Total Employees': d.total_employees || 0,
          'Active Employees': d.active_employees || 0,
          'New Hires': d.new_hires || 0,
          'Average Salary': d.average_salary || 0
        })) || [],
        {},
        ...employeeData.data.salesTeam?.map(s => {
          const achievementRate = (s.sales_target || 0) > 0 ? (s.sales_achieved / s.sales_target * 100) : 0;
          const commission = s.sales_achieved ? (s.sales_achieved * 0.05) : 0;
          return {
            'Employee Name': s.employee_name,
            'Sales Target': s.sales_target || 0,
            'Sales Achieved': s.sales_achieved || 0,
            'Achievement Rate %': achievementRate.toFixed(2),
            'Commission Earned': commission,
            'Performance Status': achievementRate >= 100 ? 'Exceeded Target' :
                              achievementRate >= 80 ? 'On Track' : 'Below Target'
          };
        }) || []
      ];
      exportToExcel(exportData, `Employee_Performance_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const exportCurrentTabData = () => {
    switch(tabValue) {
      case 0:
        const dashboardData = [
          { 'Report Type': 'Business Dashboard Summary' },
          { 'Total Sales': salesData?.data?.summary?.total_sales || 0 },
          { 'Gross Profit': pnlData?.data?.gross_profit || 0 },
          { 'Active Customers': customerData?.data?.customers?.length || 0 },
          { 'Total Orders': salesData?.data?.summary?.total_bills || 0 },
          { 'Total Employees': employeeData?.data?.summary?.total_employees || 0 },
          { 'Total Products': inventoryData?.data?.stockItems?.length || 0 },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];
        exportToExcel(dashboardData, `Dashboard_Summary_${format(new Date(), 'yyyy-MM-dd')}`);
        break;
      case 1: exportSalesData(); break;
      case 3: exportCustomerData(); break;
      case 5: exportProfitData(); break;
      case 10: exportEmployeeData(); break;
      case 11: exportInventoryData(); break;
      default:
        const genericData = [
          { 'Report Type': `Tab ${tabValue} Report` },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];
        exportToExcel(genericData, `Report_Tab_${tabValue}_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };
  
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExport = (reportType) => {
    // MOCKED PDF EXPORT
    alert(`PDF Export Triggered for: ${reportType}\n(This is mocked for testing purposes as there is no backend connected)`);
  };

  const renderLoading = (loading) => (loading ? <LinearProgress sx={{ mb: 1 }} /> : null);

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h4">
            <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
            ERP Sales & Business Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export to Excel">
              <Button
                variant="outlined"
                startIcon={<TableChart />}
                onClick={handleExportMenuOpen}
                sx={{ ml: 2 }}
              >
                Export Excel
              </Button>
            </Tooltip>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={handleExportMenuClose}
            >
              <MenuItem onClick={() => { exportCurrentTabData(); handleExportMenuClose(); }}>
                <Download sx={{ mr: 1 }} /> Export Current Tab
              </MenuItem>
              <MenuItem onClick={() => { exportSalesData(); handleExportMenuClose(); }}>
                <BarChart sx={{ mr: 1 }} /> Sales Analysis
              </MenuItem>
              <MenuItem onClick={() => { exportCustomerData(); handleExportMenuClose(); }}>
                <People sx={{ mr: 1 }} /> Customer Insights
              </MenuItem>
              <MenuItem onClick={() => { exportProfitData(); handleExportMenuClose(); }}>
                <AttachMoney sx={{ mr: 1 }} /> Profit & Loss
              </MenuItem>
              <MenuItem onClick={() => { exportInventoryData(); handleExportMenuClose(); }}>
                <Inventory sx={{ mr: 1 }} /> Inventory Analysis
              </MenuItem>
              <MenuItem onClick={() => { exportEmployeeData(); handleExportMenuClose(); }}>
                <Person sx={{ mr: 1 }} /> Employee Performance
              </MenuItem>
            </Menu>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => {
                const reportTypes = ['dashboard', 'sales', 'tax', 'customers', 'suppliers', 'profit', 'day-end', 'expenses', 'salary', 'cash-flow', 'employees', 'inventory'];
                const currentReportType = reportTypes[tabValue];
                handleExport(currentReportType);
              }}
              sx={{ ml: 2 }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      {tabValue !== 6 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={dateRange.fromDate}
                onChange={(e) => setDateRange((p) => ({ ...p, fromDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={dateRange.toDate}
                onChange={(e) => setDateRange((p) => ({ ...p, toDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<BarChart />} label="Dashboard" />
          <Tab icon={<ShoppingCart />} label="Sales Analysis" />
          <Tab icon={<Receipt />} label="Tax Analysis" />
          <Tab icon={<Group />} label="Customers" />
          <Tab icon={<Business />} label="Suppliers" />
          <Tab icon={<TrendingUp />} label="Profit & Loss" />
          <Tab icon={<Today />} label="Day End" />
          <Tab icon={<Payments />} label="Expenses" />
          <Tab icon={<AccountBalanceWallet />} label="Salary" />
          <Tab icon={<AccountBalance />} label="Cash Flow" />
          <Tab icon={<People />} label="Employees" />
          <Tab icon={<Inventory />} label="Inventory" />
        </Tabs>
      </Paper>

      {/* 0. DASHBOARD TAB */}
      {tabValue === 0 && (
        <Box>
          {renderLoading(salesLoading || customerLoading || pnlLoading || inventoryLoading || employeeLoading)}
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Management Dashboard - Business Overview</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Total Sales</Typography>
                    <Typography variant="h4">{money(salesData?.data?.summary?.total_sales || 0)}</Typography>
                    <Typography variant="body2" color="success">Revenue Performance</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Gross Profit</Typography>
                    <Typography variant="h4">{money(pnlData?.data?.summary?.gross_profit || 0)}</Typography>
                    <Typography variant="body2" color="success">Profitability</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Active Customers</Typography>
                    <Typography variant="h4">{customerData?.data?.customers?.length || 0}</Typography>
                    <Typography variant="body2" color="info">Customer Base</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Total Orders</Typography>
                    <Typography variant="h4">{salesData?.data?.summary?.total_bills || 0}</Typography>
                    <Typography variant="body2" color="info">Order Volume</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Business Growth Trends</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Revenue & Profit Trends</Typography>
                    {(() => {
                      const monthly = salesData?.data?.monthly || [];
                      const pnlMonthly = pnlData?.data?.monthly || [];
                      const chartData = {
                        labels: monthly.slice(-12).map(m => m.month || ''),
                        datasets: [
                          {
                            label: 'Sales Revenue',
                            data: monthly.slice(-12).map(m => m.sales || 0),
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            tension: 0.1,
                          },
                          {
                            label: 'Gross Profit',
                            data: pnlMonthly.slice(-12).map(m => m.profit || 0),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                          }
                        ]
                      };
                      return <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="secondary" gutterBottom>Growth Metrics</Typography>
                    {(() => {
                      const monthly = salesData?.data?.monthly || [];
                      const pnlMonthly = pnlData?.data?.monthly || [];
                      const currentMonth = monthly[monthly.length - 1] || {};
                      const previousMonth = monthly[monthly.length - 2] || {};
                      const momGrowth = previousMonth.sales ? ((currentMonth.sales - previousMonth.sales) / previousMonth.sales * 100) : 0;
                      
                      const currentYear = monthly.slice(-12);
                      const previousYear = monthly.slice(-24, -12);
                      const currentYearTotal = currentYear.reduce((sum, m) => sum + (m.sales || 0), 0);
                      const previousYearTotal = previousYear.reduce((sum, m) => sum + (m.sales || 0), 0);
                      const yoyGrowth = previousYearTotal ? ((currentYearTotal - previousYearTotal) / previousYearTotal * 100) : 0;
                      
                      const totalProfit = pnlMonthly.reduce((sum, m) => sum + (m.profit || 0), 0);
                      const totalRevenue = monthly.reduce((sum, m) => sum + (m.sales || 0), 0);
                      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
                      
                      return (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>MoM Growth:</strong> 
                            <span style={{ color: momGrowth >= 0 ? 'green' : 'red' }}>
                              {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>YoY Growth:</strong> 
                            <span style={{ color: yoyGrowth >= 0 ? 'green' : 'red' }}>
                              {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
                            </span>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Profit Margin:</strong> 
                            <span style={{ color: profitMargin > 15 ? 'green' : profitMargin > 10 ? 'orange' : 'red' }}>
                              {profitMargin.toFixed(1)}%
                            </span>
                          </Typography>
                          <Typography variant="body2">
                            <strong>Growth Status:</strong> 
                            <span style={{ color: yoyGrowth > 10 ? 'green' : yoyGrowth > 0 ? 'orange' : 'red' }}>
                              {yoyGrowth > 10 ? 'Strong Growth' : yoyGrowth > 0 ? 'Moderate' : 'Declining'}
                            </span>
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top Performers</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Top Products by Revenue</Typography>
                    {(() => {
                      const products = salesData?.data?.products || [];
                      const topProducts = products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5);
                      const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
                      
                      return (
                        <>
                          {topProducts.map((product, index) => (
                            <Box key={product.product_id || index} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{index + 1}. {product.product_name}</strong>
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {money(product.revenue || 0)} ({totalRevenue > 0 ? ((product.revenue || 0) / totalRevenue * 100).toFixed(1) : 0}% of total)
                              </Typography>
                            </Box>
                          ))}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="secondary" gutterBottom>Top Customers by Revenue</Typography>
                    {(() => {
                      const customers = customerData?.data?.customers || [];
                      const topCustomers = customers.sort((a, b) => (b.total_purchase || 0) - (a.total_purchase || 0)).slice(0, 5);
                      const totalRevenue = customers.reduce((sum, c) => sum + (c.total_purchase || 0), 0);
                      
                      return (
                        <>
                          {topCustomers.map((customer, index) => (
                            <Box key={customer.key || index} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                <strong>{index + 1}. {customer.customer_name}</strong>
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {money(customer.total_purchase || 0)} ({totalRevenue > 0 ? ((customer.total_purchase || 0) / totalRevenue * 100).toFixed(1) : 0}% of total)
                              </Typography>
                            </Box>
                          ))}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Operations Summary</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Inventory Health</Typography>
                    {(() => {
                      const items = inventoryData?.data?.stockItems || [];
                      const totalItems = items.length;
                      const fastMovingItems = items.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2);
                      const slowMovingItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0));
                      const deadStockItems = items.filter(i => (i.stock || 0) === 0);
                      const totalValue = items.reduce((sum, i) => sum + (i.stock_value || 0), 0);
                      
                      return (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total Products:</strong> {totalItems}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Fast Moving:</strong> <span style={{ color: 'green' }}>{fastMovingItems.length}</span>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Slow Moving:</strong> <span style={{ color: 'orange' }}>{slowMovingItems.length}</span>
                          </Typography>
                          <Typography variant="body2">
                            <strong>Out of Stock:</strong> <span style={{ color: 'red' }}>{deadStockItems.length}</span>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Total Inventory Value:</strong> {money(totalValue)}
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" color="secondary" gutterBottom>Employee Performance</Typography>
                    {(() => {
                      const summary = employeeData?.data?.summary || {};
                      const totalEmployees = summary.total_employees || 0;
                      const activeEmployees = summary.active_employees || 0;
                      const monthly = pnlData?.data?.monthly || [];
                      const latestRevenue = monthly[monthly.length - 1]?.sales || 0;
                      const revenuePerEmployee = totalEmployees > 0 ? latestRevenue / totalEmployees : 0;
                      
                      return (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Total Employees:</strong> {totalEmployees}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Active Employees:</strong> <span style={{ color: 'green' }}>{activeEmployees}</span>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Revenue/Employee:</strong> {money(revenuePerEmployee)}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Productivity:</strong> 
                            <span style={{ color: revenuePerEmployee > 100000 ? 'green' : revenuePerEmployee > 50000 ? 'orange' : 'red' }}>
                              {revenuePerEmployee > 100000 ? 'Excellent' : revenuePerEmployee > 50000 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Key Business Indicators</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Average Order Value</Typography>
                    {(() => {
                      const totalSales = salesData?.data?.summary?.total_sales || 0;
                      const totalOrders = salesData?.data?.summary?.total_bills || 0;
                      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
                      return <Typography variant="h5">{money(avgOrderValue)}</Typography>;
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Customer Retention</Typography>
                    {(() => {
                      const customers = customerData?.data?.customers || [];
                      const returningCustomers = customers.filter(c => (c.total_bills || 0) > 1);
                      const retentionRate = customers.length > 0 ? (returningCustomers.length / customers.length * 100) : 0;
                      return (
                        <>
                          <Typography variant="h5">{retentionRate.toFixed(1)}%</Typography>
                          <Typography variant="body2" color={retentionRate > 70 ? 'success' : retentionRate > 50 ? 'warning' : 'error'}>
                            {retentionRate > 70 ? 'Excellent' : retentionRate > 50 ? 'Good' : 'Poor'}
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Profit Margin</Typography>
                    {(() => {
                      const monthly = pnlData?.data?.monthly || [];
                      const totalProfit = monthly.reduce((sum, m) => sum + (m.profit || 0), 0);
                      const totalRevenue = monthly.reduce((sum, m) => sum + (m.sales || 0), 0);
                      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;
                      return (
                        <>
                          <Typography variant="h5">{profitMargin.toFixed(1)}%</Typography>
                          <Typography variant="body2" color={profitMargin > 15 ? 'success' : profitMargin > 10 ? 'warning' : 'error'}>
                            {profitMargin > 15 ? 'Healthy' : profitMargin > 10 ? 'Moderate' : 'Low'}
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" color="primary" gutterBottom>Inventory Turnover</Typography>
                    {(() => {
                      const items = inventoryData?.data?.stockItems || [];
                      const totalValue = items.reduce((sum, i) => sum + (i.stock_value || 0), 0);
                      const monthlySales = salesData?.data?.monthly?.slice(-3).reduce((sum, m) => sum + (m.sales || 0), 0) || 0;
                      const turnoverRate = totalValue > 0 ? (monthlySales * 4) / totalValue : 0;
                      return (
                        <>
                          <Typography variant="h5">{turnoverRate.toFixed(1)}x</Typography>
                          <Typography variant="body2" color={turnoverRate > 4 ? 'success' : turnoverRate > 2 ? 'warning' : 'error'}>
                            {turnoverRate > 4 ? 'Fast' : turnoverRate > 2 ? 'Normal' : 'Slow'}
                          </Typography>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      )}

      {/* 1. SALES ANALYSIS TAB */}
      {tabValue === 1 && (
        <Box>
          {renderLoading(salesLoading)}
          {salesData?.data ? (
            <>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Product-wise Sales Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Products by Revenue</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const topProducts = products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10);
                          const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
                          
                          return (
                            <>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Product</TableCell>
                                      <TableCell align="right">Quantity</TableCell>
                                      <TableCell align="right">Revenue</TableCell>
                                      <TableCell align="right">Contribution %</TableCell>
                                      <TableCell align="right">Avg Price</TableCell>
                                      <TableCell align="right">Performance</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {topProducts.map((p, index) => {
                                      const avgPrice = (p.quantity_sold || 0) > 0 ? (p.revenue || 0) / p.quantity_sold : 0;
                                      const contribution = totalRevenue > 0 ? ((p.revenue || 0) / totalRevenue * 100) : 0;
                                      const performance = contribution > 15 ? 'Excellent' : contribution > 8 ? 'Good' : contribution > 3 ? 'Average' : 'Low';
                                      
                                      return (
                                        <TableRow key={p.product_id || index}>
                                          <TableCell>{p.product_name}</TableCell>
                                          <TableCell align="right">{p.quantity_sold || 0}</TableCell>
                                          <TableCell align="right">{money(p.revenue || 0)}</TableCell>
                                          <TableCell align="right">
                                            <span style={{ color: contribution > 10 ? 'success.main' : contribution > 5 ? 'warning.main' : 'error.main' }}>
                                              {contribution.toFixed(1)}%
                                            </span>
                                          </TableCell>
                                          <TableCell align="right">{money(avgPrice)}</TableCell>
                                          <TableCell align="right">
                                            <span style={{ 
                                              color: performance === 'Excellent' ? 'success.main' : 
                                                     performance === 'Good' ? 'warning.main' : 
                                                     performance === 'Average' ? 'info.main' : 'error.main'
                                            }}>
                                              {performance}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Product Insights</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const totalProducts = products.length;
                          const activeProducts = products.filter(p => (p.quantity_sold || 0) > 0);
                          const avgRevenuePerProduct = totalProducts > 0 ? products.reduce((sum, p) => sum + (p.revenue || 0), 0) / totalProducts : 0;
                          const topProduct = products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0];
                          const totalQuantity = products.reduce((sum, p) => sum + (p.quantity_sold || 0), 0);
                          const avgQuantityPerProduct = totalProducts > 0 ? totalQuantity / totalProducts : 0;
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Products:</strong> {totalProducts}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Active Products:</strong> {activeProducts.length} ({totalProducts > 0 ? (activeProducts.length / totalProducts * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Revenue/Product:</strong> {money(avgRevenuePerProduct)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Quantity/Product:</strong> {avgQuantityPerProduct.toFixed(0)} units
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Top Product:</strong> {topProduct?.product_name || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Product Health:</strong> 
                                <span style={{ color: activeProducts.length / totalProducts > 0.7 ? 'success.main' : activeProducts.length / totalProducts > 0.5 ? 'warning.main' : 'error.main' }}>
                                  {activeProducts.length / totalProducts > 0.7 ? 'Excellent' : activeProducts.length / totalProducts > 0.5 ? 'Good' : 'Poor'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Product Comparison Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Category Performance</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const categories = {};
                          products.forEach(p => {
                            const category = p.category || 'Uncategorized';
                            if (!categories[category]) {
                              categories[category] = { count: 0, revenue: 0, quantity: 0 };
                            }
                            categories[category].count++;
                            categories[category].revenue += p.revenue || 0;
                            categories[category].quantity += p.quantity_sold || 0;
                          });
                          
                          return (
                            <>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Category</TableCell>
                                      <TableCell align="right">Products</TableCell>
                                      <TableCell align="right">Revenue</TableCell>
                                      <TableCell align="right">Quantity</TableCell>
                                      <TableCell align="right">Avg/Prod</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {Object.entries(categories).map(([category, data]) => (
                                      <TableRow key={category}>
                                        <TableCell>{category}</TableCell>
                                        <TableCell align="right">{data.count}</TableCell>
                                        <TableCell align="right">{money(data.revenue)}</TableCell>
                                        <TableCell align="right">{data.quantity}</TableCell>
                                        <TableCell align="right">{money(data.count > 0 ? data.revenue / data.count : 0)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Product Performance Distribution</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const totalRevenue = products.reduce((sum, p) => sum + (p.revenue || 0), 0);
                          const top10Revenue = products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10).reduce((sum, p) => sum + (p.revenue || 0), 0);
                          const bottom50Revenue = products.sort((a, b) => (a.revenue || 0) - (b.revenue || 0)).slice(0, Math.floor(products.length * 0.5)).reduce((sum, p) => sum + (p.revenue || 0), 0);
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Top 10 Products:</strong> {money(top10Revenue)} ({totalRevenue > 0 ? (top10Revenue / totalRevenue * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Bottom 50%:</strong> {money(bottom50Revenue)} ({totalRevenue > 0 ? (bottom50Revenue / totalRevenue * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Concentration:</strong> 
                                <span style={{ color: (top10Revenue / totalRevenue) > 0.8 ? 'warning.main' : (top10Revenue / totalRevenue) > 0.6 ? 'info.main' : 'success.main' }}>
                                  {(top10Revenue / totalRevenue) > 0.8 ? 'High Risk' : (top10Revenue / totalRevenue) > 0.6 ? 'Moderate' : 'Diversified'}
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Strategy:</strong> 
                                <span style={{ color: (top10Revenue / totalRevenue) > 0.8 ? 'warning.main' : 'success.main' }}>
                                  {(top10Revenue / totalRevenue) > 0.8 ? 'Diversify Portfolio' : 'Optimize Mix'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Time-based Sales Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Sales Trends</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const currentMonth = monthly[monthly.length - 1] || {};
                          const previousMonth = monthly[monthly.length - 2] || {};
                          const momGrowth = previousMonth.sales ? ((currentMonth.sales - previousMonth.sales) / previousMonth.sales * 100) : 0;
                          
                          const currentYear = monthly.slice(-12);
                          const previousYear = monthly.slice(-24, -12);
                          const currentYearTotal = currentYear.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const previousYearTotal = previousYear.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const yoyGrowth = previousYearTotal ? ((currentYearTotal - previousYearTotal) / previousYearTotal * 100) : 0;
                          
                          const currentQuarter = monthly.slice(-3);
                          const previousQuarter = monthly.slice(-6, -3);
                          const currentQuarterTotal = currentQuarter.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const previousQuarterTotal = previousQuarter.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const qoqGrowth = previousQuarterTotal ? ((currentQuarterTotal - previousQuarterTotal) / previousQuarterTotal * 100) : 0;
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Current Month:</strong> {money(currentMonth.sales || 0)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Month-over-Month:</strong> 
                                <span style={{ color: momGrowth >= 0 ? 'success.main' : 'error.main' }}>
                                  {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Quarter-over-Quarter:</strong> 
                                <span style={{ color: qoqGrowth >= 0 ? 'success.main' : 'error.main' }}>
                                  {qoqGrowth >= 0 ? '+' : ''}{qoqGrowth.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Year-over-Year:</strong> 
                                <span style={{ color: yoyGrowth >= 0 ? 'success.main' : 'error.main' }}>
                                  {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Growth Status:</strong> 
                                <span style={{ color: yoyGrowth > 15 ? 'success.main' : yoyGrowth > 5 ? 'warning.main' : yoyGrowth > -5 ? 'info.main' : 'error.main' }}>
                                  {yoyGrowth > 15 ? 'Excellent' : yoyGrowth > 5 ? 'Good' : yoyGrowth > -5 ? 'Stable' : 'Declining'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Period Performance</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const last30Days = monthly.slice(-1).reduce((sum, m) => sum + (m.sales || 0), 0);
                          const last90Days = monthly.slice(-3).reduce((sum, m) => sum + (m.sales || 0), 0);
                          const last6Months = monthly.slice(-6).reduce((sum, m) => sum + (m.sales || 0), 0);
                          const lastYear = monthly.slice(-12).reduce((sum, m) => sum + (m.sales || 0), 0);
                          
                          const dailyAvg30 = last30Days / 30;
                          const dailyAvg90 = last90Days / 90;
                          const dailyAvgYear = lastYear / 365;
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Last 30 Days:</strong> {money(last30Days)} (Avg: {money(dailyAvg30)}/day)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Last 90 Days:</strong> {money(last90Days)} (Avg: {money(dailyAvg90)}/day)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Last 6 Months:</strong> {money(last6Months)} (Avg: {money(last6Months/180)}/day)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Last 12 Months:</strong> {money(lastYear)} (Avg: {money(dailyAvgYear)}/day)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Daily Trend:</strong> 
                                <span style={{ color: dailyAvg30 > dailyAvg90 ? 'success.main' : dailyAvg30 > dailyAvgYear ? 'warning.main' : 'error.main' }}>
                                  {dailyAvg30 > dailyAvg90 ? 'Accelerating' : dailyAvg30 > dailyAvgYear ? 'Stable' : 'Decelerating'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Seasonal & Quarterly Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Quarterly Performance</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const quarters = [];
                          
                          for (let i = 0; i < monthly.length; i += 3) {
                            const quarterMonths = monthly.slice(i, i + 3);
                            const quarterTotal = quarterMonths.reduce((sum, m) => sum + (m.sales || 0), 0);
                            const quarterLabel = `Q${Math.floor(i / 3) + 1} 2023`;
                            quarters.push({ label: quarterLabel, total: quarterTotal });
                          }
                          
                          return (
                            <>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Quarter</TableCell>
                                      <TableCell align="right">Revenue</TableCell>
                                      <TableCell align="right">Growth %</TableCell>
                                      <TableCell align="right">Contribution</TableCell>
                                      <TableCell align="right">Performance</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {quarters.slice(-4).map((quarter, index) => {
                                      const prevQuarter = quarters[index - 1];
                                      const growth = prevQuarter && prevQuarter.total > 0 ? 
                                        ((quarter.total - prevQuarter.total) / prevQuarter.total * 100) : 0;
                                      const totalRevenue = quarters.reduce((sum, q) => sum + q.total, 0);
                                      const contribution = totalRevenue > 0 ? (quarter.total / totalRevenue * 100) : 0;
                                      const performance = growth > 20 ? 'Excellent' : growth > 10 ? 'Good' : growth > 0 ? 'Positive' : 'Declining';
                                      
                                      return (
                                        <TableRow key={quarter.label}>
                                          <TableCell>{quarter.label}</TableCell>
                                          <TableCell align="right">{money(quarter.total)}</TableCell>
                                          <TableCell align="right">
                                            <span style={{ color: growth >= 0 ? 'success.main' : 'error.main' }}>
                                              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                                            </span>
                                          </TableCell>
                                          <TableCell align="right">{contribution.toFixed(1)}%</TableCell>
                                          <TableCell align="right">
                                            <span style={{ 
                                              color: performance === 'Excellent' ? 'success.main' : 
                                                     performance === 'Good' ? 'warning.main' : 
                                                     performance === 'Positive' ? 'info.main' : 'error.main'
                                            }}>
                                              {performance}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Seasonal Insights</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const currentMonth = monthly[monthly.length - 1] || {};
                          const monthIndex = new Date(currentMonth.month + ' 1 2023').getMonth();
                          
                          let season = '';
                          let seasonColor = '';
                          if (monthIndex >= 2 && monthIndex <= 4) {
                            season = 'Spring'; seasonColor = 'success.main';
                          } else if (monthIndex >= 5 && monthIndex <= 7) {
                            season = 'Summer'; seasonColor = 'warning.main';
                          } else if (monthIndex >= 8 && monthIndex <= 10) {
                            season = 'Fall'; seasonColor = 'info.main';
                          } else {
                            season = 'Winter'; seasonColor = 'primary.main';
                          }
                          
                          const springAvg = 450000;
                          const summerAvg = 520000;
                          const fallAvg = 580000;
                          const winterAvg = 650000;
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Current Season:</strong> 
                                <span style={{ color: seasonColor }}> {season}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Best Season:</strong> 
                                <span style={{ color: 'primary.main' }}> Winter ({money(winterAvg)})</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Spring Avg:</strong> {money(springAvg)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Summer Avg:</strong> {money(summerAvg)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Fall Avg:</strong> {money(fallAvg)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Winter Avg:</strong> {money(winterAvg)}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sales Performance Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Total Revenue</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const totalRevenue = monthly.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const currentMonth = monthly[monthly.length - 1]?.sales || 0;
                          const previousMonth = monthly[monthly.length - 2]?.sales || 0;
                          const momGrowth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth * 100) : 0;
                          
                          return (
                            <>
                              <Typography variant="h4" sx={{ textAlign: 'center', mb: 1 }}>
                                {money(totalRevenue)}
                              </Typography>
                              <Typography variant="body2" sx={{ textAlign: 'center', color: momGrowth >= 0 ? 'success.main' : 'error.main' }}>
                                {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}% MoM
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Avg Order Value</Typography>
                        {(() => {
                          const summary = salesData.data.summary || {};
                          const totalSales = summary.total_sales || 0;
                          const totalOrders = summary.total_bills || 0;
                          const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
                          
                          return (
                            <>
                              <Typography variant="h4" sx={{ textAlign: 'center', mb: 1 }}>
                                {money(avgOrderValue)}
                              </Typography>
                              <Typography variant="body2" sx={{ textAlign: 'center', color: avgOrderValue > 10000 ? 'success.main' : avgOrderValue > 5000 ? 'warning.main' : 'error.main' }}>
                                {avgOrderValue > 10000 ? 'High Value' : avgOrderValue > 5000 ? 'Moderate' : 'Low Value'}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Conversion Rate</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const activeProducts = products.filter(p => (p.quantity_sold || 0) > 0);
                          const conversionRate = products.length > 0 ? (activeProducts.length / products.length * 100) : 0;
                          
                          return (
                            <>
                              <Typography variant="h4" sx={{ textAlign: 'center', mb: 1 }}>
                                {conversionRate.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" sx={{ textAlign: 'center', color: conversionRate > 80 ? 'success.main' : conversionRate > 60 ? 'warning.main' : 'error.main' }}>
                                {conversionRate > 80 ? 'Excellent' : conversionRate > 60 ? 'Good' : 'Poor'}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Sales Velocity</Typography>
                        {(() => {
                          const monthly = salesData.data.monthly || [];
                          const last3Months = monthly.slice(-3);
                          const avgMonthlySales = last3Months.length > 0 ? last3Months.reduce((sum, m) => sum + (m.sales || 0), 0) / last3Months.length : 0;
                          const dailyVelocity = avgMonthlySales / 30;
                          
                          return (
                            <>
                              <Typography variant="h4" sx={{ textAlign: 'center', mb: 1 }}>
                                {money(dailyVelocity)}/day
                              </Typography>
                              <Typography variant="body2" sx={{ textAlign: 'center', color: dailyVelocity > 100000 ? 'success.main' : dailyVelocity > 50000 ? 'warning.main' : 'error.main' }}>
                                {dailyVelocity > 100000 ? 'Fast' : dailyVelocity > 50000 ? 'Normal' : 'Slow'}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Product Performance Analytics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Products Revenue Distribution</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const topProducts = products.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 8);
                          const chartData = {
                            labels: topProducts.map(p => p.product_name || ''),
                            datasets: [{
                              label: 'Revenue',
                              data: topProducts.map(p => p.revenue || 0),
                              backgroundColor: [
                                'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
                                'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Product Category Performance</Typography>
                        {(() => {
                          const products = salesData.data.products || [];
                          const categories = {};
                          products.forEach(p => {
                            const category = p.category || 'Uncategorized';
                            if (!categories[category]) {
                              categories[category] = { revenue: 0, quantity: 0 };
                            }
                            categories[category].revenue += p.revenue || 0;
                            categories[category].quantity += p.quantity_sold || 0;
                          });
                          
                          const chartData = {
                            labels: Object.keys(categories),
                            datasets: [
                              {
                                label: 'Revenue',
                                data: Object.values(categories).map(c => c.revenue),
                                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                                borderColor: 'rgb(54, 162, 235)',
                                borderWidth: 1
                              },
                              {
                                label: 'Quantity',
                                data: Object.values(categories).map(c => c.quantity),
                                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                                borderColor: 'rgb(255, 99, 132)',
                                borderWidth: 1
                              }
                            ]
                          };
                          return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sales Performance Chart</Typography>
                {(() => {
                  const monthly = salesData.data.monthly || [];
                  const chartData = {
                    labels: monthly.slice(-12).map(m => m.month || ''),
                    datasets: [{
                      label: 'Monthly Sales',
                      data: monthly.slice(-12).map(m => m.sales || 0),
                      borderColor: 'rgb(75, 192, 192)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.1
                    }]
                  };
                  return <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                })()}
              </Paper>
            </>
          ) : <Alert severity="info">No sales data available</Alert>}
        </Box>
      )}

      {/* 2. TAX TAB */}
      {tabValue === 2 && (
        <Box>
          {renderLoading(taxLoading)}
          {taxData?.data ? (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Tax Analysis & Insights</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="primary" gutterBottom>Tax Metrics</Typography>
                      {(() => {
                        const outputTax = taxData.data.summary?.output_tax || 0;
                        const netTaxPayable = taxData.data.summary?.net_tax_payable || 0;
                        const taxableSales = taxData.data.summary?.taxable_sales || 0;
                        const effectiveTaxRate = taxableSales > 0 ? (outputTax / taxableSales) * 100 : 0;
                        
                        return (
                          <>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Effective Tax Rate:</strong> {effectiveTaxRate.toFixed(2)}%
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Tax as % of Sales:</strong> {taxableSales > 0 ? (netTaxPayable / taxableSales * 100).toFixed(2) : 0}%
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Tax Burden:</strong> <span style={{ color: effectiveTaxRate > 10 ? 'red' : effectiveTaxRate > 5 ? 'orange' : 'green' }}>{effectiveTaxRate > 10 ? 'High' : effectiveTaxRate > 5 ? 'Moderate' : 'Optimal'}</span>
                            </Typography>
                            <Typography variant="body2">
                              <strong>Input Tax Credit:</strong> {money(outputTax - netTaxPayable)}
                            </Typography>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="subtitle1" color="secondary" gutterBottom>Compliance Indicators</Typography>
                      {(() => {
                        const outputTax = taxData.data.summary?.output_tax || 0;
                        const netTaxPayable = taxData.data.summary?.net_tax_payable || 0;
                        return (
                          <>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Tax Collection Efficiency:</strong> {outputTax > 0 ? ((outputTax - netTaxPayable) / outputTax * 100).toFixed(1) : 0}% credit utilization
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Monthly Tax Liability:</strong> {money(netTaxPayable)}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Tax Compliance:</strong> <span style={{ color: 'green' }}>On Track</span>
                            </Typography>
                            <Typography variant="body2">
                              <strong>Filing Status:</strong> <span style={{ color: 'blue' }}>Current Period</span>
                            </Typography>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          ) : <Alert severity="info">No tax report data available</Alert>}
        </Box>
      )}

      {/* 3. CUSTOMERS TAB */}
      {tabValue === 3 && (
        <Box>
          {renderLoading(customerLoading)}
          {customerData?.data ? (
            <>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer-wise Sales Report</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Customers by Revenue</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const topCustomers = customers.sort((a, b) => (b.total_purchase || 0) - (a.total_purchase || 0)).slice(0, 10);
                          const totalRevenue = customers.reduce((sum, c) => sum + (c.total_purchase || 0), 0);
                          
                          return (
                            <>
                              <TableContainer>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Customer</TableCell>
                                      <TableCell align="right">Total Sales</TableCell>
                                      <TableCell align="right">Quantity</TableCell>
                                      <TableCell align="right">Avg Order Value</TableCell>
                                      <TableCell align="right">Purchase Frequency</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {topCustomers.map((c, index) => (
                                      <TableRow key={c.key || c.customer_name || index}>
                                        <TableCell>{c.customer_name}</TableCell>
                                        <TableCell align="right">{money(c.total_purchase || 0)}</TableCell>
                                        <TableCell align="right">{c.total_quantity || 0}</TableCell>
                                        <TableCell align="right">
                                          {c.total_bills ? money((c.total_purchase || 0) / c.total_bills) : money(0)}
                                        </TableCell>
                                        <TableCell align="right">{c.total_bills || 0} orders</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Customer Insights</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const totalCustomers = customers.length;
                          const totalRevenue = customers.reduce((sum, c) => sum + (c.total_purchase || 0), 0);
                          const avgOrderValue = customers.reduce((sum, c) => sum + ((c.total_purchase || 0) / Math.max(c.total_bills || 1, 1)), 0) / Math.max(totalCustomers, 1);
                          const topCustomer = customers.sort((a, b) => (b.total_purchase || 0) - (a.total_purchase || 0))[0];
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Customers:</strong> {totalCustomers}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Revenue:</strong> {money(totalRevenue)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Order Value:</strong> {money(avgOrderValue)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Top Customer:</strong> {topCustomer?.customer_name || 'N/A'}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer Analytics Charts</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Customers Revenue Share</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const topCustomers = customers.sort((a, b) => (b.total_purchase || 0) - (a.total_purchase || 0)).slice(0, 8);
                          const chartData = {
                            labels: topCustomers.map(c => c.customer_name || ''),
                            datasets: [{
                              label: 'Revenue',
                              data: topCustomers.map(c => c.total_purchase || 0),
                              backgroundColor: [
                                'rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)',
                                'rgba(199, 199, 199, 0.8)', 'rgba(83, 102, 255, 0.8)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Customer Segmentation Analysis</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const highValueCustomers = customers.filter(c => (c.total_purchase || 0) > 100000);
                          const mediumValueCustomers = customers.filter(c => (c.total_purchase || 0) > 50000 && (c.total_purchase || 0) <= 100000);
                          const lowValueCustomers = customers.filter(c => (c.total_purchase || 0) <= 50000);
                          
                          const chartData = {
                            labels: ['High Value (>₹1L)', 'Medium Value (₹50K-₹1L)', 'Low Value (≤₹50K)'],
                            datasets: [{
                              label: 'Customer Count',
                              data: [highValueCustomers.length, mediumValueCustomers.length, lowValueCustomers.length],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(255, 206, 86)',
                                'rgb(255, 99, 132)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer Segmentation</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Value-based Segmentation</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const totalCustomers = customers.length;
                          const highValueCustomers = customers.filter(c => (c.total_purchase || 0) > 100000);
                          const mediumValueCustomers = customers.filter(c => (c.total_purchase || 0) > 50000 && (c.total_purchase || 0) <= 100000);
                          const lowValueCustomers = customers.filter(c => (c.total_purchase || 0) <= 50000);
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>High Value (&gt;₹1L):</strong> {highValueCustomers.length} ({totalCustomers > 0 ? (highValueCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Medium Value (₹50K-₹1L):</strong> {mediumValueCustomers.length} ({totalCustomers > 0 ? (mediumValueCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Low Value (≤₹50K):</strong> {lowValueCustomers.length} ({totalCustomers > 0 ? (lowValueCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Segment Health:</strong> 
                                <span style={{ color: highValueCustomers.length > totalCustomers * 0.2 ? 'green' : highValueCustomers.length > totalCustomers * 0.1 ? 'orange' : 'red' }}>
                                  {highValueCustomers.length > totalCustomers * 0.2 ? 'Excellent' : highValueCustomers.length > totalCustomers * 0.1 ? 'Good' : 'Needs Improvement'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Frequency-based Segmentation</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const totalCustomers = customers.length;
                          const frequentCustomers = customers.filter(c => (c.total_bills || 0) >= 10);
                          const regularCustomers = customers.filter(c => (c.total_bills || 0) >= 5 && (c.total_bills || 0) < 10);
                          const occasionalCustomers = customers.filter(c => (c.total_bills || 0) < 5);
                          
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Frequent (≥10 orders):</strong> {frequentCustomers.length} ({totalCustomers > 0 ? (frequentCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Regular (5-9 orders):</strong> {regularCustomers.length} ({totalCustomers > 0 ? (regularCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Occasional (&lt;5 orders):</strong> {occasionalCustomers.length} ({totalCustomers > 0 ? (occasionalCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Loyalty Index:</strong> 
                                <span style={{ color: frequentCustomers.length > totalCustomers * 0.3 ? 'green' : frequentCustomers.length > totalCustomers * 0.15 ? 'orange' : 'red' }}>
                                  {frequentCustomers.length > totalCustomers * 0.3 ? 'High' : frequentCustomers.length > totalCustomers * 0.15 ? 'Medium' : 'Low'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </>
          ) : <Alert severity="info">No customer report data</Alert>}
        </Box>
      )}

      {/* 4. SUPPLIERS TAB */}
      {tabValue === 4 && (
        <Box>
          {renderLoading(supplierLoading)}
          {supplierData?.data ? (
            <>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Supplier Purchase & Due</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Supplier</TableCell><TableCell align="right">Bills</TableCell><TableCell align="right">Purchase</TableCell><TableCell align="right">Paid</TableCell><TableCell align="right">Due</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(supplierData.data.suppliers || []).map((s) => (
                        <TableRow key={s.key || s.supplier_name}>
                          <TableCell>{s.supplier_name}</TableCell>
                          <TableCell align="right">{s.total_bills}</TableCell>
                          <TableCell align="right">{money(s.total_purchase)}</TableCell>
                          <TableCell align="right">{money(s.total_paid)}</TableCell>
                          <TableCell align="right">{money(s.total_due)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Supplier Analysis & Insights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Supplier Performance</Typography>
                        {(() => {
                          const suppliers = supplierData.data.suppliers || [];
                          const totalSuppliers = suppliers.length;
                          const activeSuppliers = suppliers.filter(s => (s.total_bills || 0) > 0);
                          const highValueSuppliers = suppliers.filter(s => (s.total_purchase || 0) > 100000);
                          const avgPurchasePerSupplier = totalSuppliers > 0 ? suppliers.reduce((sum, s) => sum + (s.total_purchase || 0), 0) / totalSuppliers : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Suppliers:</strong> {totalSuppliers}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Active Suppliers:</strong> {activeSuppliers.length} ({totalSuppliers > 0 ? (activeSuppliers.length / totalSuppliers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>High Value (&gt;₹1L):</strong> {highValueSuppliers.length} ({totalSuppliers > 0 ? (highValueSuppliers.length / totalSuppliers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Avg Purchase/Supplier:</strong> {money(avgPurchasePerSupplier)}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Payment Patterns</Typography>
                        {(() => {
                          const suppliers = supplierData.data.suppliers || [];
                          const totalDue = suppliers.reduce((sum, s) => sum + (s.total_due || 0), 0);
                          const totalPaid = suppliers.reduce((sum, s) => sum + (s.total_paid || 0), 0);
                          const totalPurchase = suppliers.reduce((sum, s) => sum + (s.total_purchase || 0), 0);
                          const overdueSuppliers = suppliers.filter(s => (s.total_due || 0) > 0);
                          const paymentRate = totalPurchase > 0 ? (totalPaid / totalPurchase * 100) : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Payables:</strong> <span style={{ color: totalDue > 0 ? 'orange' : 'green' }}>{money(totalDue)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Payment Rate:</strong> {paymentRate.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Suppliers with Dues:</strong> {overdueSuppliers.length} ({suppliers.length > 0 ? (overdueSuppliers.length / suppliers.length * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Payment Health:</strong> <span style={{ color: paymentRate > 80 ? 'green' : paymentRate > 60 ? 'orange' : 'red' }}>
                                  {paymentRate > 80 ? 'Excellent' : paymentRate > 60 ? 'Good' : 'Needs Attention'}
                                </span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </>
          ) : <Alert severity="info">No supplier report data</Alert>}
        </Box>
      )}

      {/* 5. PROFIT AND LOSS TAB */}
      {tabValue === 5 && (
        <Box>
          {renderLoading(pnlLoading)}
          {pnlData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Sales</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.sales_amount || 0)}</Typography>
                      <Typography variant="body2" color="info">Revenue</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Cost</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.purchase_amount || 0)}</Typography>
                      <Typography variant="body2" color="warning">Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Gross Profit</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.gross_profit || 0)}</Typography>
                      <Typography variant="body2" color="success">Before Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Net Profit</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.net_profit || pnlData.data.summary?.gross_profit || 0)}</Typography>
                      <Typography variant="body2" color="success">After Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Profit Analytics Charts</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Monthly Profit Trends</Typography>
                        {(() => {
                          const monthly = pnlData.data.monthly || [];
                          const chartData = {
                            labels: monthly.slice(-12).map(m => m.month || ''),
                            datasets: [
                              {
                                label: 'Gross Profit',
                                data: monthly.slice(-12).map(m => m.profit || 0),
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                tension: 0.1
                              },
                              {
                                label: 'Net Profit',
                                data: monthly.slice(-12).map(m => (m.profit || 0) * 0.85),
                                borderColor: 'rgb(54, 162, 235)',
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                tension: 0.1
                              }
                            ]
                          };
                          return <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Profit Margin Analysis</Typography>
                        {(() => {
                          const monthly = pnlData.data.monthly || [];
                          const marginData = monthly.slice(-12).map(m => {
                            const sales = m.sales || 0;
                            const profit = m.profit || 0;
                            return sales > 0 ? (profit / sales * 100) : 0;
                          });
                          
                          const chartData = {
                            labels: monthly.slice(-12).map(m => m.month || ''),
                            datasets: [{
                              label: 'Profit Margin %',
                              data: marginData,
                              backgroundColor: marginData.map(m => m > 20 ? 'rgba(75, 192, 192, 0.8)' : m > 10 ? 'rgba(255, 206, 86, 0.8)' : 'rgba(255, 99, 132, 0.8)'),
                              borderColor: marginData.map(m => m > 20 ? 'rgb(75, 192, 192)' : m > 10 ? 'rgb(255, 206, 86)' : 'rgb(255, 99, 132)'),
                              borderWidth: 1
                            }]
                          };
                          return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Profit Details</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Month</TableCell>
                        <TableCell align="right">Sales</TableCell>
                        <TableCell align="right">Cost</TableCell>
                        <TableCell align="right">Gross Profit</TableCell>
                        <TableCell align="right">Margin %</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(pnlData.data.monthly || []).map((m) => {
                        const margin = m.sales > 0 ? (m.profit / m.sales * 100) : 0;
                        return (
                          <TableRow key={m.month}>
                            <TableCell>{m.month}</TableCell>
                            <TableCell align="right">{money(m.sales || 0)}</TableCell>
                            <TableCell align="right">{money(m.purchase || 0)}</TableCell>
                            <TableCell align="right" sx={{ color: (m.profit || 0) >= 0 ? 'green' : 'red' }}>
                              {money(m.profit || 0)}
                            </TableCell>
                            <TableCell align="right">
                              <span style={{ color: margin >= 20 ? 'green' : margin >= 10 ? 'orange' : 'red' }}>
                                {margin.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell align="right">
                              <span style={{ color: (m.profit || 0) >= 0 ? 'green' : 'red' }}>
                                {(m.profit || 0) >= 0 ? 'Profit' : 'Loss'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : (
            <Alert severity="info">No profit & loss data available</Alert>
          )}
        </Box>
      )}

      {/* 6. DAY END TAB */}
      {tabValue === 6 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Day End Date"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Paper>
          {renderLoading(dayLoading)}
          {dayData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Sales</Typography><Typography variant="h4">{money(dayData.data.sales_amount)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Purchase</Typography><Typography variant="h4">{money(dayData.data.purchase_amount)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Collections</Typography><Typography variant="h4">{money(dayData.data.customer_collections)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Supplier Payments</Typography><Typography variant="h4">{money(dayData.data.supplier_payments)}</Typography></CardContent></Card></Grid>
              </Grid>
            </>
          ) : <Alert severity="info">No day-end data available</Alert>}
        </Box>
      )}

      {/* 7. EXPENSES TAB */}
      {tabValue === 7 && (
        <Box>
          {renderLoading(expenseLoading)}
          {expenseData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Total Expenses</Typography><Typography variant="h4">{money(expenseData.data.summary?.total_expenses)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Operating</Typography><Typography variant="h4">{money(expenseData.data.summary?.operating_expenses)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Administrative</Typography><Typography variant="h4">{money(expenseData.data.summary?.administrative_expenses)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Other</Typography><Typography variant="h4">{money(expenseData.data.summary?.other_expenses)}</Typography></CardContent></Card></Grid>
              </Grid>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Expense Breakdown</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Category</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">% of Total</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(expenseData.data.expenses || []).map((e) => (
                        <TableRow key={e.category}>
                          <TableCell>{e.category}</TableCell>
                          <TableCell align="right">{money(e.amount)}</TableCell>
                          <TableCell align="right">{expenseData.data.summary?.total_expenses ? ((e.amount / expenseData.data.summary.total_expenses) * 100).toFixed(2) : 0}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : <Alert severity="info">No expense report data</Alert>}
        </Box>
      )}

      {/* 8. SALARY TAB */}
      {tabValue === 8 && (
        <Box>
          {renderLoading(salaryLoading)}
          {salaryData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Total Salary</Typography><Typography variant="h4">{money(salaryData.data.summary?.total_salary)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Employees</Typography><Typography variant="h4">{salaryData.data.summary?.total_employees || 0}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Avg Salary</Typography><Typography variant="h4">{money(salaryData.data.summary?.average_salary)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">This Month</Typography><Typography variant="h4">{money(salaryData.data.summary?.current_month_salary)}</Typography></CardContent></Card></Grid>
              </Grid>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Salary Details</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Department</TableCell><TableCell align="right">Employees</TableCell><TableCell align="right">Total Salary</TableCell><TableCell align="right">Average</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(salaryData.data.departments || []).map((d) => (
                        <TableRow key={d.department}>
                          <TableCell>{d.department}</TableCell>
                          <TableCell align="right">{d.employee_count}</TableCell>
                          <TableCell align="right">{money(d.total_salary)}</TableCell>
                          <TableCell align="right">{money(d.average_salary)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : <Alert severity="info">No salary report data</Alert>}
        </Box>
      )}

      {/* 9. CASH FLOW TAB */}
      {tabValue === 9 && (
        <Box>
          {renderLoading(cashFlowLoading)}
          {cashFlowData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Total Inflow</Typography><Typography variant="h4">{money(cashFlowData.data.summary?.total_inflow)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Total Outflow</Typography><Typography variant="h4">{money(cashFlowData.data.summary?.total_outflow)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Net Flow</Typography><Typography variant="h4">{money(cashFlowData.data.summary?.net_cash_flow)}</Typography></CardContent></Card></Grid>
                <Grid item xs={12} md={3}><Card><CardContent><Typography variant="h6">Opening Balance</Typography><Typography variant="h4">{money(cashFlowData.data.summary?.opening_balance)}</Typography></CardContent></Card></Grid>
              </Grid>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Cash Flow Details</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(cashFlowData.data.transactions || []).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.date}</TableCell>
                          <TableCell>{t.type}</TableCell>
                          <TableCell>{t.description}</TableCell>
                          <TableCell align="right">{money(t.amount)}</TableCell>
                          <TableCell align="right">{money(t.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : <Alert severity="info">No cash flow report data</Alert>}
        </Box>
      )}

      {/* 10. EMPLOYEES TAB */}
      {tabValue === 10 && (
        <Box>
          {renderLoading(employeeLoading)}
          {employeeData?.data ? (
            <>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Total Employees</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.total_employees || 0}</Typography>
                      <Typography variant="body2" color="info">Team Size</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Active</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.active_employees || 0}</Typography>
                      <Typography variant="body2" color="success">Working Staff</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">New Hires</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.new_hires || 0}</Typography>
                      <Typography variant="body2" color="warning">Recent Joiners</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Attrition</Typography>
                      <Typography variant="h4">{employeeData.data.summary?.attrition_rate || 0}%</Typography>
                      <Typography variant="body2" color={employeeData.data.summary?.attrition_rate > 10 ? 'error' : employeeData.data.summary?.attrition_rate > 5 ? 'warning' : 'success'}>
                        {employeeData.data.summary?.attrition_rate > 10 ? 'High' : employeeData.data.summary?.attrition_rate > 5 ? 'Moderate' : 'Low'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sales Performance Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Salesperson Performance</Typography>
                        {(() => {
                          const salesTeam = employeeData.data.salesTeam || [];
                          const topPerformers = salesTeam.sort((a, b) => (b.sales_achieved || 0) - (a.sales_achieved || 0)).slice(0, 10);
                          
                          return (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Salesperson</TableCell>
                                    <TableCell align="right">Target</TableCell>
                                    <TableCell align="right">Achieved</TableCell>
                                    <TableCell align="right">Achievement %</TableCell>
                                    <TableCell align="right">Commission</TableCell>
                                    <TableCell align="right">Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {topPerformers.map((salesperson, index) => {
                                    const achievementRate = (salesperson.sales_target || 0) > 0 ? (salesperson.sales_achieved / salesperson.sales_target * 100) : 0;
                                    const commission = salesperson.sales_achieved ? (salesperson.sales_achieved * 0.05) : 0; 
                                    return (
                                      <TableRow key={salesperson.employee_id || index}>
                                        <TableCell>{salesperson.employee_name}</TableCell>
                                        <TableCell align="right">{money(salesperson.sales_target || 0)}</TableCell>
                                        <TableCell align="right">{money(salesperson.sales_achieved || 0)}</TableCell>
                                        <TableCell align="right">
                                          <span style={{ color: achievementRate >= 100 ? 'green' : achievementRate >= 80 ? 'orange' : 'red' }}>
                                            {achievementRate.toFixed(1)}%
                                          </span>
                                        </TableCell>
                                        <TableCell align="right">{money(commission)}</TableCell>
                                        <TableCell align="right">
                                          <span style={{ 
                                            color: achievementRate >= 100 ? 'green' : achievementRate >= 80 ? 'orange' : 'red',
                                            fontWeight: achievementRate >= 100 ? 'bold' : 'normal'
                                          }}>
                                            {achievementRate >= 100 ? 'Exceeded' : achievementRate >= 80 ? 'On Track' : 'Below Target'}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </>
          ) : (
            <Alert severity="info">No employee report data</Alert>
          )}
        </Box>
      )}

      {/* 11. INVENTORY TAB */}
      {tabValue === 11 && (
        <Box>
          {renderLoading(inventoryLoading)}
          {inventoryData?.data ? (
            <>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Inventory Analytics Charts</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Stock Movement Distribution</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const fastMovingItems = items.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2);
                          const slowMovingItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0));
                          const deadStockItems = items.filter(i => (i.stock || 0) === 0);
                          
                          const chartData = {
                            labels: ['Fast Moving', 'Slow Moving', 'Dead Stock'],
                            datasets: [{
                              label: 'Product Count',
                              data: [fastMovingItems.length, slowMovingItems.length, deadStockItems.length],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(255, 206, 86)',
                                'rgb(255, 99, 132)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Inventory Value Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const fastMovingValue = items
                            .filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2)
                            .reduce((sum, i) => sum + (i.stock_value || 0), 0);
                          const slowMovingValue = items
                            .filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0))
                            .reduce((sum, i) => sum + (i.stock_value || 0), 0);
                          const deadStockValue = items
                            .filter(i => (i.stock || 0) === 0)
                            .reduce((sum, i) => sum + (i.stock_value || 0), 0);
                          
                          const chartData = {
                            labels: ['Fast Moving', 'Slow Moving', 'Dead Stock'],
                            datasets: [{
                              label: 'Stock Value',
                              data: [fastMovingValue, slowMovingValue, deadStockValue],
                              backgroundColor: [
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                              ],
                              borderColor: [
                                'rgb(54, 162, 235)',
                                'rgb(255, 159, 64)',
                                'rgb(153, 102, 255)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Fast Moving Products</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Fast Moving Items</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const fastMovingItems = items
                            .filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2)
                            .sort((a, b) => (b.stock || 0) - (a.stock || 0))
                            .slice(0, 10);
                          
                          return (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Current Stock</TableCell>
                                    <TableCell align="right">Min Level</TableCell>
                                    <TableCell align="right">Stock Ratio</TableCell>
                                    <TableCell align="right">Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {fastMovingItems.map((item, index) => {
                                    const stockRatio = (item.stock || 0) / Math.max(item.min_stock_level || 1, 1);
                                    return (
                                      <TableRow key={item.item_id || index}>
                                        <TableCell>{item.item_name}</TableCell>
                                        <TableCell align="right">{item.stock || 0}</TableCell>
                                        <TableCell align="right">{item.min_stock_level || 0}</TableCell>
                                        <TableCell align="right">{stockRatio.toFixed(1)}x</TableCell>
                                        <TableCell align="right">
                                          <span style={{ color: stockRatio > 3 ? 'green' : stockRatio > 2 ? 'blue' : 'orange' }}>
                                            {stockRatio > 3 ? 'Very Fast' : stockRatio > 2 ? 'Fast' : 'Moderate'}
                                          </span>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
            </>
          ) : (
            <Alert severity="info">No inventory data available</Alert>
          )}
        </Box>
      )}

    </Box>
  );
};

export default Reports;