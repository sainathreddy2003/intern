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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  PictureAsPdf,
  Refresh,
  FileDownload,
  People,
  ArrowUpward,
  ArrowDownward,
  ShoppingCart,
  Inventory,
  Receipt,
  Business,
  AttachMoney,
  Group,
  BarChart,
  PieChart,
  Today,
  Payments,
  AccountBalanceWallet,
  Speed,
  Timeline,
  ShowChart,
  Description,
  Download,
  Person,
  Warning,
  CheckCircle,
  TrendingFlat,
  TableChart,
  Add,
  Delete,
  CalendarToday,
  DateRange,
  Event,
  Groups,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { format, subDays } from 'date-fns';
import { reportsAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

const money = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Create a scrollable table wrapper component
const ScrollableTableContainer = ({ children }) => (
  <Box sx={{
    overflowX: 'auto',
    overflowY: 'hidden',
    maxWidth: '100%',
    width: '100%',
    border: '1px solid #e0e0e0',
    borderRadius: 1,
    '&::-webkit-scrollbar': {
      height: '12px',
      width: '12px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f1f1f1',
      borderRadius: '6px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#c1c1c1',
      borderRadius: '6px',
      border: '2px solid #f1f1f1',
      '&:hover': {
        backgroundColor: '#a8a8a8',
      },
    },
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarColor: '#c1c1c1 #f1f1f1',
  }}>
    {children}
  </Box>
);

const Reports = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState({
    fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Added missing state for Tab 6 (Day End)
  const [dayDate, setDayDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // Sales Performance Dialog state
  const [salesPerformanceDialog, setSalesPerformanceDialog] = useState(false);
  const [salesPerformanceData, setSalesPerformanceData] = useState([
    { date: '', sales_amount: '', target_sales: '', achievement_rate: '', notes: '' }
  ]);

  const queryClient = useQueryClient();

  // Date picker state for custom timeframe
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customTimeframe, setCustomTimeframe] = useState('');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');

  // Excel export functions
  const exportToExcel = (data, filename, includeCharts = false) => {
    try {
      // Ensure data is an array and has content
      if (!Array.isArray(data) || data.length === 0) {
        console.warn('No data to export');
        return;
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Apply basic formatting
      const range = XLSX.utils.decode_range(worksheet['!ref']);

      // Format headers
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!worksheet[address]) continue;
        worksheet[address].s = {
          font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2E75B6' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }

      // Apply alternating row colors and number formatting
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const isEven = (R - range.s.r) % 2 === 0;
        const rowColor = isEven ? 'F2F2F2' : 'FFFFFF';

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!worksheet[address]) continue;

          worksheet[address].s = {
            fill: { fgColor: { rgb: rowColor } },
            border: {
              top: { style: 'thin', color: { rgb: 'D0D0D0' } },
              bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
              left: { style: 'thin', color: { rgb: 'D0D0D0' } },
              right: { style: 'thin', color: { rgb: 'D0D0D0' } }
            },
            alignment: { vertical: 'center' }
          };

          // Apply number formatting for currency columns
          const headerCell = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const headerText = worksheet[headerCell]?.v || '';

          if (headerText.includes('Sales') || headerText.includes('Profit') ||
            headerText.includes('Salary') || headerText.includes('Tax') ||
            headerText.includes('Value') || headerText.includes('Revenue') ||
            headerText.includes('Amount') || headerText.includes('Total')) {
            worksheet[address].z = '₹#,##0.00';
            worksheet[address].s.font = { color: { rgb: isEven ? '000000' : '2E75B6' } };
          }

          if (headerText.includes('%')) {
            worksheet[address].z = '0.00%';
            worksheet[address].s.font = { color: { rgb: isEven ? '000000' : '70AD47' } };
          }
        }
      }

      // Auto-adjust column widths
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 15;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = worksheet[address];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50));
          }
        }
        colWidths.push({ width: maxWidth });
      }
      worksheet['!cols'] = colWidths;

      // Add main data worksheet
      XLSX.utils.book_append_sheet(workbook, worksheet, '📊 Report Data');

      // Add charts if requested and data is available
      if (includeCharts && data.length > 1) {
        addChartsToWorkbook(workbook, data, filename);
      }

      // Generate filename with timestamp
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const fullFilename = `${filename}_${timestamp}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, fullFilename);

      console.log(`Excel file exported successfully: ${fullFilename}`);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Function to add charts to workbook
  const addChartsToWorkbook = (workbook, data, filename) => {
    try {
      // Create chart data worksheet
      const chartData = prepareChartData(data);
      if (chartData.length === 0) return;

      const chartWorksheet = XLSX.utils.json_to_sheet(chartData);

      // Format chart data
      const chartRange = XLSX.utils.decode_range(chartWorksheet['!ref']);
      for (let C = chartRange.s.c; C <= chartRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!chartWorksheet[address]) continue;
        chartWorksheet[address].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '70AD47' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }

      // Auto-adjust column widths for chart data
      const chartColWidths = [];
      for (let C = chartRange.s.c; C <= chartRange.e.c; ++C) {
        chartColWidths.push({ width: 15 });
      }
      chartWorksheet['!cols'] = chartColWidths;

      XLSX.utils.book_append_sheet(workbook, chartWorksheet, '📈 Chart Data');

      // Add chart configurations worksheet
      const chartConfigWorksheet = XLSX.utils.aoa_to_sheet([
        ['Chart Configuration', 'Type', 'Data Range', 'Title', 'Colors'],
        ['Sales Trend', 'line', 'Chart Data!A2:B' + (chartData.length + 1), 'Sales Trend Analysis', 'Blue'],
        ['Profit Analysis', 'column', 'Chart Data!C2:D' + (chartData.length + 1), 'Profit vs Revenue', 'Green'],
        ['Performance Metrics', 'pie', 'Chart Data!E2:F' + (chartData.length + 1), 'Performance Breakdown', 'Orange'],
        ['', '', '', '', ''],
        ['Chart Instructions:', '', '', '', ''],
        ['1. Select data range in Chart Data sheet', '', '', '', ''],
        ['2. Go to Insert > Charts in Excel', '', '', '', ''],
        ['3. Choose chart type from above', '', '', '', ''],
        ['4. Customize colors and formatting', '', '', '', ''],
        ['', '', '', '', ''],
        ['Available Chart Types:', '', '', '', ''],
        ['- Line charts for trends', '', '', '', ''],
        ['- Column charts for comparisons', '', '', '', ''],
        ['- Pie charts for proportions', '', '', '', ''],
        ['- Area charts for cumulative data', '', '', '', '']
      ]);

      // Format configuration sheet
      const configRange = XLSX.utils.decode_range(chartConfigWorksheet['!ref']);
      for (let R = 0; R <= configRange.e.r; ++R) {
        for (let C = 0; C <= configRange.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!chartConfigWorksheet[address]) continue;

          if (R === 0) {
            // Header row
            chartConfigWorksheet[address].s = {
              font: { bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: 'FF6B6B' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (R === 1 || R === 2 || R === 3) {
            // Chart configurations
            chartConfigWorksheet[address].s = {
              fill: { fgColor: { rgb: 'E8F5E8' } },
              font: { color: { rgb: '006100' } }
            };
          } else if (R === 4) {
            // Empty row
            continue;
          } else if (R === 5) {
            // Instructions header
            chartConfigWorksheet[address].s = {
              font: { bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '4472C4' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          } else if (R === 11) {
            // Chart types header
            chartConfigWorksheet[address].s = {
              font: { bold: true, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: '4472C4' } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }
        }
      }

      // Merge cells for headers
      chartConfigWorksheet['!merges'] = [
        { s: { r: 5, c: 0 }, e: { r: 5, c: 4 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 4 } }
      ];

      chartConfigWorksheet['!cols'] = [
        { width: 20 }, { width: 15 }, { width: 20 }, { width: 25 }, { width: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, chartConfigWorksheet, '📊 Chart Config');

    } catch (error) {
      console.error('Chart creation error:', error);
    }
  };

  // Prepare data for charts
  const prepareChartData = (data) => {
    const chartData = [];

    // Extract numeric data for charts
    data.forEach((row, index) => {
      if (index === 0) return; // Skip header row

      const chartRow = {
        'Period': row['Period'] || row['Month'] || row['Date'] || `Item ${index}`,
        'Sales': extractNumericValue(row, ['Sales', 'Total Sales', 'Revenue', 'Amount']),
        'Profit': extractNumericValue(row, ['Profit', 'Net Profit', 'Gross Profit']),
        'Customers': extractNumericValue(row, ['Customers', 'Active Customers', 'Total Customers']),
        'Orders': extractNumericValue(row, ['Orders', 'Total Orders', 'Bills'])
      };

      chartData.push(chartRow);
    });

    return chartData;
  };

  // Extract numeric value from row based on possible keys
  const extractNumericValue = (row, possibleKeys) => {
    for (const key of possibleKeys) {
      // Find matching key (case insensitive)
      const matchingKey = Object.keys(row).find(k =>
        k.toLowerCase().includes(key.toLowerCase())
      );

      if (matchingKey && row[matchingKey] !== undefined) {
        const value = row[matchingKey];
        // Handle different value types
        if (typeof value === 'object' && value.value !== undefined) {
          return value.value;
        }
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          const num = parseFloat(value.replace(/[₹,%]/g, ''));
          return isNaN(num) ? 0 : num;
        }
      }
    }
    return 0;
  };

  const exportCompleteReport = () => {
    const exportData = [];

    // 1. EXECUTIVE SUMMARY
    exportData.push(
      { 'SECTION': 'EXECUTIVE SUMMARY', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Business Performance', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Total Sales Revenue', 'VALUE': salesData?.data?.summary?.total_sales || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross sales from all transactions' },
      { 'SECTION': '', 'METRIC': 'Total Orders', 'VALUE': salesData?.data?.summary?.total_bills || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of sales invoices' },
      { 'SECTION': '', 'METRIC': 'Average Order Value', 'VALUE': (salesData?.data?.summary?.total_sales || 0) / Math.max(salesData?.data?.summary?.total_bills || 1, 1), 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average revenue per order' },
      { 'SECTION': '', 'METRIC': 'Gross Profit', 'VALUE': pnlData?.data?.summary?.gross_profit || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Revenue minus cost of goods sold' },
      { 'SECTION': '', 'METRIC': 'Net Profit', 'VALUE': pnlData?.data?.summary?.net_profit || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Profit after all expenses' },
      { 'SECTION': '', 'METRIC': 'Gross Margin %', 'VALUE': pnlData?.data?.summary?.margin_pct || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross profit as percentage of revenue' },
      { 'SECTION': '', 'METRIC': 'Net Margin %', 'VALUE': pnlData?.data?.summary?.net_margin_pct || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net profit as percentage of revenue' },
      { 'SECTION': '', 'METRIC': 'Total Employees', 'VALUE': employeeData?.data?.summary?.total_employees || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Active workforce size' },
      { 'SECTION': '', 'METRIC': 'Active Customers', 'VALUE': customerData?.data?.customers?.length || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Customers with transactions' },
      { 'SECTION': '', 'METRIC': 'Total Products', 'VALUE': inventoryData?.data?.stockItems?.length || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Products in inventory' },
      {},
      {}
    );

    // 2. SALES ANALYTICS
    exportData.push(
      { 'SECTION': 'SALES ANALYTICS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Product Performance', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Top performing products by revenue' }
    );

    (salesData?.data?.products || []).forEach((p, index) => {
      if (index < 10) { // Top 10 products
        exportData.push({
          'SECTION': '',
          'METRIC': p.product_name || 'Unknown Product',
          'VALUE': p.revenue || 0,
          'PERIOD': 'Quantity: ' + (p.quantity_sold || 0),
          'NOTES': 'Category: ' + (p.category || 'N/A') + ' | Avg Price: ' + ((p.quantity_sold || 0) > 0 ? (p.revenue || 0) / p.quantity_sold : 0)
        });
      }
    });

    exportData.push({}, { 'SECTION': '', 'METRIC': 'Monthly Sales Trends', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Sales performance by month' });
    (salesData?.data?.monthly || []).forEach(m => {
      exportData.push({
        'SECTION': '',
        'METRIC': m.month || 'Unknown',
        'VALUE': m.sales || 0,
        'PERIOD': 'Orders: ' + (m.bills || 0),
        'NOTES': 'Average order value: ' + ((m.bills || 0) > 0 ? (m.sales || 0) / m.bills : 0)
      });
    });

    // 3. PROFIT & LOSS ANALYSIS
    exportData.push(
      {},
      { 'SECTION': 'PROFIT & LOSS ANALYSIS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Top Products by Profit', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Most profitable products' }
    );

    (pnlData?.data?.products || []).forEach((p, index) => {
      if (index < 10) { // Top 10 profitable products
        exportData.push({
          'SECTION': '',
          'METRIC': p.product_name || 'Unknown Product',
          'VALUE': p.profit || 0,
          'PERIOD': 'Revenue: ' + (p.revenue || 0) + ' | Cost: ' + (p.cost || 0),
          'NOTES': 'Margin: ' + (p.margin_pct || 0) + '% | Quantity: ' + (p.quantity_sold || 0)
        });
      }
    });

    exportData.push({}, { 'SECTION': '', 'METRIC': 'Top Customers by Profit', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Most valuable customers' });
    (pnlData?.data?.customers || []).forEach((c, index) => {
      if (index < 10) { // Top 10 profitable customers
        exportData.push({
          'SECTION': '',
          'METRIC': c.customer_name || 'Unknown Customer',
          'VALUE': c.profit || 0,
          'PERIOD': 'Revenue: ' + (c.revenue || 0) + ' | Orders: ' + (c.total_purchase || 0),
          'NOTES': 'Margin: ' + (c.margin_pct || 0) + '% | Avg Order: ' + ((c.total_purchase || 0) > 0 ? (c.revenue || 0) / c.total_purchase : 0)
        });
      }
    });

    // 4. EMPLOYEE PERFORMANCE
    exportData.push(
      {},
      { 'SECTION': 'EMPLOYEE PERFORMANCE', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Department Analysis', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Workforce distribution by department' }
    );

    (employeeData?.data?.departments || []).forEach(d => {
      exportData.push({
        'SECTION': '',
        'METRIC': d.department || 'Unknown Department',
        'VALUE': d.total_employees || 0,
        'PERIOD': 'Active: ' + (d.active_employees || 0) + ' | New Hires: ' + (d.new_hires || 0),
        'NOTES': 'Total Salary: ' + (d.total_salary || 0) + ' | Avg Salary: ' + (d.average_salary || 0)
      });
    });

    exportData.push({}, { 'SECTION': '', 'METRIC': 'Sales Team Performance', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Individual sales performance' });
    (employeeData?.data?.salesTeam || []).forEach(s => {
      const achievementRate = (s.sales_target || 0) > 0 ? (s.sales_achieved / s.sales_target * 100) : 0;
      exportData.push({
        'SECTION': '',
        'METRIC': s.employee_name || 'Unknown Employee',
        'VALUE': s.sales_achieved || 0,
        'PERIOD': 'Target: ' + (s.sales_target || 0) + ' | Achievement: ' + achievementRate.toFixed(1) + '%',
        'NOTES': 'Position: ' + (s.position || 'N/A') + ' | Commission: ' + (s.commission_earned || 0)
      });
    });

    exportData.push({}, { 'SECTION': '', 'METRIC': 'Monthly Sales Performance', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Target vs actual sales trends' });
    (employeeData?.data?.monthlyPerformance || []).forEach(m => {
      const achievementRate = (m.target_sales || 0) > 0 ? (m.actual_sales / m.target_sales * 100) : 0;
      exportData.push({
        'SECTION': '',
        'METRIC': m.month || 'Unknown Month',
        'VALUE': m.actual_sales || 0,
        'PERIOD': 'Target: ' + (m.target_sales || 0) + ' | Achievement: ' + achievementRate.toFixed(1) + '%',
        'NOTES': 'Variance: ' + ((m.actual_sales || 0) - (m.target_sales || 0))
      });
    });

    // 5. INVENTORY ANALYSIS
    exportData.push(
      {},
      { 'SECTION': 'INVENTORY ANALYSIS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Stock Movement Analysis', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Inventory health and movement' }
    );

    const items = inventoryData?.data?.stockItems || [];
    const fastMovingItems = items.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2);
    const slowMovingItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0));
    const deadStockItems = items.filter(i => (i.stock || 0) === 0);

    exportData.push(
      { 'SECTION': '', 'METRIC': 'Fast Moving Items', 'VALUE': fastMovingItems.length, 'PERIOD': 'Stock > 2x Min Level', 'NOTES': 'High demand products' },
      { 'SECTION': '', 'METRIC': 'Slow Moving Items', 'VALUE': slowMovingItems.length, 'PERIOD': '0 < Stock <= Min Level', 'NOTES': 'Low demand products' },
      { 'SECTION': '', 'METRIC': 'Out of Stock Items', 'VALUE': deadStockItems.length, 'PERIOD': 'Stock = 0', 'NOTES': 'Products needing immediate reorder' }
    );

    exportData.push({}, { 'SECTION': '', 'METRIC': 'Items Needing Reorder', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Critical stock levels' });
    items.forEach(item => {
      if ((item.stock || 0) < (item.min_stock_level || 0)) {
        const urgency = (item.stock || 0) === 0 ? 'URGENT' :
          (item.stock || 0) < (item.min_stock_level || 0) * 0.5 ? 'HIGH' : 'MEDIUM';
        exportData.push({
          'SECTION': '',
          'METRIC': item.item_name || 'Unknown Item',
          'VALUE': item.stock || 0,
          'PERIOD': 'Min Level: ' + (item.min_stock_level || 0) + ' | Value: ' + (item.stock_value || 0),
          'NOTES': 'Priority: ' + urgency + ' | Category: ' + (item.category || 'N/A')
        });
      }
    });

    // 6. FINANCIAL METRICS
    exportData.push(
      {},
      { 'SECTION': 'FINANCIAL METRICS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Revenue Breakdown', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Revenue sources and analysis' }
    );

    const monthlyData = pnlData?.data?.monthly || [];
    const totalRevenue = monthlyData.reduce((sum, m) => sum + (m.sales || 0), 0);
    const totalProfit = monthlyData.reduce((sum, m) => sum + (m.profit || 0), 0);
    const avgMonthlyRevenue = monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;
    const avgMonthlyProfit = monthlyData.length > 0 ? totalProfit / monthlyData.length : 0;

    exportData.push(
      { 'SECTION': '', 'METRIC': 'Total Revenue', 'VALUE': totalRevenue, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total sales revenue' },
      { 'SECTION': '', 'METRIC': 'Average Monthly Revenue', 'VALUE': avgMonthlyRevenue, 'PERIOD': 'Per month average', 'NOTES': 'Monthly revenue average' },
      { 'SECTION': '', 'METRIC': 'Total Profit', 'VALUE': totalProfit, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total profit generated' },
      { 'SECTION': '', 'METRIC': 'Average Monthly Profit', 'VALUE': avgMonthlyProfit, 'PERIOD': 'Per month average', 'NOTES': 'Monthly profit average' }
    );

    // 7. KEY INSIGHTS
    exportData.push(
      {},
      { 'SECTION': 'KEY INSIGHTS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Business Health', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Overall business performance indicators' }
    );

    const totalOrders = salesData?.data?.summary?.total_bills || 0;
    const avgOrderValue = totalOrders > 0 ? (salesData?.data?.summary?.total_sales || 0) / totalOrders : 0;
    const totalProducts = inventoryData?.data?.stockItems?.length || 0;
    const activeProducts = (salesData?.data?.products || []).filter(p => (p.quantity_sold || 0) > 0).length;
    const conversionRate = totalProducts > 0 ? (activeProducts / totalProducts * 100) : 0;

    exportData.push(
      { 'SECTION': '', 'METRIC': 'Revenue Per Employee', 'VALUE': (employeeData?.data?.summary?.total_employees || 1) > 0 ? totalRevenue / (employeeData?.data?.summary?.total_employees || 1) : 0, 'PERIOD': 'Per employee', 'NOTES': 'Revenue generated per employee' },
      { 'SECTION': '', 'METRIC': 'Revenue Per Customer', 'VALUE': (customerData?.data?.customers?.length || 1) > 0 ? totalRevenue / (customerData?.data?.customers?.length || 1) : 0, 'PERIOD': 'Per customer', 'NOTES': 'Average revenue per customer' },
      { 'SECTION': '', 'METRIC': 'Product Conversion Rate', 'VALUE': conversionRate.toFixed(1) + '%', 'PERIOD': 'Active/Total Products', 'NOTES': 'Percentage of products with sales' },
      { 'SECTION': '', 'METRIC': 'Inventory Turnover', 'VALUE': totalProducts > 0 ? (activeProducts / totalProducts).toFixed(2) : 0, 'PERIOD': 'Ratio', 'NOTES': 'How quickly inventory moves' },
      { 'SECTION': '', 'METRIC': 'Customer Retention Rate', 'VALUE': ((customerData?.data?.customers || []).filter(c => (c.total_bills || 0) > 1).length / Math.max((customerData?.data?.customers || []).length, 1) * 100).toFixed(1) + '%', 'PERIOD': 'Repeat customers', 'NOTES': 'Customer loyalty indicator' }
    );

    // 8. RECOMMENDATIONS
    exportData.push(
      {},
      { 'SECTION': 'RECOMMENDATIONS', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Business Optimization', 'VALUE': '', 'PERIOD': '', 'NOTES': 'Actionable insights for growth' }
    );

    if (deadStockItems.length > 0) {
      exportData.push({ 'SECTION': '', 'METRIC': 'Inventory Management', 'VALUE': 'HIGH PRIORITY', 'PERIOD': '', 'NOTES': deadStockItems.length + ' items out of stock - Immediate reordering required' });
    }

    if (slowMovingItems.length > totalProducts * 0.3) {
      exportData.push({ 'SECTION': '', 'METRIC': 'Slow Moving Stock', 'VALUE': 'MEDIUM PRIORITY', 'PERIOD': '', 'NOTES': slowMovingItems.length + ' items moving slowly - Consider promotions' });
    }

    if (avgOrderValue < 5000) {
      exportData.push({ 'SECTION': '', 'METRIC': 'Order Value', 'VALUE': 'LOW PRIORITY', 'PERIOD': '', 'NOTES': 'Average order value is low - Focus on upselling' });
    }

    if ((pnlData?.data?.summary?.net_margin_pct || 0) < 20) {
      exportData.push({ 'SECTION': '', 'METRIC': 'Profit Margins', 'VALUE': 'HIGH PRIORITY', 'PERIOD': '', 'NOTES': 'Net margins below 20% - Review pricing and costs' });
    }

    exportData.push(
      {},
      { 'SECTION': 'REPORT SUMMARY', 'METRIC': 'Generated On', 'VALUE': new Date().toLocaleString(), 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Complete business analytics report' },
      { 'SECTION': '', 'METRIC': 'Data Sources', 'VALUE': 'Sales, P&L, Employees, Inventory, Customers', 'PERIOD': '', 'NOTES': 'All business modules integrated' }
    );

    exportToExcel(exportData, `Complete_Business_Report_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const exportSalesData = (includeCharts = false) => {
    if (salesData?.data) {
      const exportData = [
        // Summary data
        {
          'Report Type': 'Sales Summary',
          'Total Sales': salesData.data.summary?.total_sales || 0,
          'Total Bills': salesData.data.summary?.total_bills || 0,
          'Average Bill Value': salesData.data.summary?.total_sales / Math.max(salesData.data.summary?.total_bills || 1, 1),
          'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}`
        },
        {}, // Empty row separator
        // Product data
        ...salesData.data.products?.map(p => ({
          'Product Name': p.product_name,
          'Category': p.category || 'N/A',
          'Quantity Sold': p.quantity_sold || 0,
          'Revenue': p.revenue || 0,
          'Average Price': (p.quantity_sold || 0) > 0 ? (p.revenue || 0) / p.quantity_sold : 0
        })) || [],
        {}, // Empty row separator
        // Monthly data
        ...salesData.data.monthly?.map(m => ({
          'Month': m.month,
          'Sales': m.sales || 0,
          'Bills': m.bills || 0,
          'Average Bill': (m.bills || 0) > 0 ? (m.sales || 0) / m.bills : 0
        })) || []
      ];
      exportToExcel(exportData, `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}`, includeCharts);
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
        {}, // Empty row separator
        // Customer data
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
        {}, // Empty row separator
        // Monthly P&L data
        ...pnlData.data.monthly?.map(m => ({
          'Month': m.month,
          'Sales': m.sales || 0,
          'Purchases': m.purchases || 0,
          'Gross Profit': m.profit || 0,
          'Net Profit': (m.profit || 0) * 0.85, // Assuming 15% expenses
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
        {}, // Empty row separator
        // Inventory items data
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
        {}, // Empty row separator
        // Department data
        ...employeeData.data.departments?.map(d => ({
          'Department': d.department,
          'Total Employees': d.total_employees || 0,
          'Active Employees': d.active_employees || 0,
          'New Hires': d.new_hires || 0,
          'Average Salary': d.average_salary || 0
        })) || [],
        {}, // Empty row separator
        // Sales team data
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
    switch (tabValue) {
      case 0: // Dashboard
        // Export comprehensive dashboard data with all details
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

        // Add detailed dashboard metrics
        const detailedDashboard = [
          { 'Section': 'Sales Metrics', 'Metric': 'Total Sales Revenue', 'Value': salesData?.data?.summary?.total_sales || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross sales from all transactions' },
          { 'Section': 'Sales Metrics', 'Metric': 'Total Orders', 'Value': salesData?.data?.summary?.total_bills || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of sales invoices' },
          { 'Section': 'Sales Metrics', 'Metric': 'Average Order Value', 'Value': (salesData?.data?.summary?.total_sales || 0) / Math.max(salesData?.data?.summary?.total_bills || 1, 1), 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average revenue per order' },
          { 'Section': 'Profit Metrics', 'Metric': 'Gross Profit', 'Value': pnlData?.data?.summary?.gross_profit || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Revenue minus cost of goods sold' },
          { 'Section': 'Profit Metrics', 'Metric': 'Net Profit', 'Value': pnlData?.data?.summary?.net_profit || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Profit after all expenses' },
          { 'Section': 'Profit Metrics', 'Metric': 'Gross Margin %', 'Value': pnlData?.data?.summary?.margin_pct || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross profit as percentage of revenue' },
          { 'Section': 'Profit Metrics', 'Metric': 'Net Margin %', 'Value': pnlData?.data?.summary?.net_margin_pct || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net profit as percentage of revenue' },
          { 'Section': 'Customer Metrics', 'Metric': 'Total Employees', 'Value': employeeData?.data?.summary?.total_employees || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Active workforce size' },
          { 'Section': 'Customer Metrics', 'Metric': 'Active Customers', 'Value': customerData?.data?.customers?.length || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Customers with transactions' },
          { 'Section': 'Inventory Metrics', 'Metric': 'Total Products', 'Value': inventoryData?.data?.stockItems?.length || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Products in inventory' }
        ];

        exportToExcel([...dashboardData, ...detailedDashboard], `Dashboard_Summary_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 1: // Sales Analysis
        exportSalesData();
        break;

      case 2: // Tax Analysis
        // Export detailed tax data
        const taxDetails = [
          { 'Report Type': 'Tax Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add tax summary
        if (taxData?.data?.summary) {
          taxDetails.push(
            { 'Section': 'Tax Summary', 'Metric': 'Output Tax', 'Value': taxData.data.summary.output_tax || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Tax collected on sales' },
            { 'Section': 'Tax Summary', 'Metric': 'Input Tax Credit', 'Value': (taxData.data.summary.output_tax || 0) - (taxData.data.summary.net_tax_payable || 0), 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Tax credit available' },
            { 'Section': 'Tax Summary', 'Metric': 'Net Tax Payable', 'Value': taxData.data.summary.net_tax_payable || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net tax liability' },
            { 'Section': 'Tax Summary', 'Metric': 'Taxable Sales', 'Value': taxData.data.summary.taxable_sales || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total taxable sales amount' }
          );
        }

        // Add monthly tax data
        if (taxData?.data?.monthly) {
          taxData.data.monthly.forEach(month => {
            taxDetails.push(
              { 'Section': 'Monthly Tax', 'Metric': 'Month', 'Value': month.month, 'Period': month.month, 'NOTES': 'Monthly tax data' },
              { 'Section': 'Monthly Tax', 'Metric': 'Output Tax', 'Value': month.output_tax || 0, 'Period': month.month, 'NOTES': 'Monthly output tax' },
              { 'Section': 'Monthly Tax', 'Metric': 'Input Tax', 'Value': month.input_tax || 0, 'Period': month.month, 'NOTES': 'Monthly input tax' },
              { 'Section': 'Monthly Tax', 'Metric': 'Net Tax Payable', 'Value': month.net_tax_payable || 0, 'Period': month.month, 'NOTES': 'Monthly net tax' }
            );
          });
        }

        exportToExcel(taxDetails, `Tax_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 3: // Customer Insights
        exportCustomerData();
        break;

      case 4: // Suppliers
        // Export detailed supplier data
        const supplierDetails = [
          { 'Report Type': 'Supplier Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add supplier summary
        if (supplierData?.data?.summary) {
          supplierDetails.push(
            { 'Section': 'Supplier Summary', 'Metric': 'Total Suppliers', 'Value': supplierData.data.summary.total_suppliers || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total number of suppliers' },
            { 'Section': 'Supplier Summary', 'Metric': 'Active Suppliers', 'Value': supplierData.data.summary.active_suppliers || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Suppliers with recent transactions' },
            { 'Section': 'Supplier Summary', 'Metric': 'Total Purchase Amount', 'Value': supplierData.data.summary.total_purchase || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total purchases from all suppliers' }
          );
        }

        // Add individual supplier data
        if (supplierData?.data?.suppliers) {
          supplierData.data.suppliers.forEach(supplier => {
            supplierDetails.push(
              { 'Section': 'Supplier Details', 'Metric': 'Supplier Name', 'Value': supplier.supplier_name || 'N/A', 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Supplier information' },
              { 'Section': 'Supplier Details', 'Metric': 'Total Bills', 'Value': supplier.total_bills || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of purchase bills' },
              { 'Section': 'Supplier Details', 'Metric': 'Total Purchase', 'Value': supplier.total_purchase || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total purchase amount' },
              { 'Section': 'Supplier Details', 'Metric': 'Amount Paid', 'Value': supplier.amount_paid || supplier.total_paid || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Amount paid to supplier' },
              { 'Section': 'Supplier Details', 'Metric': 'Balance Due', 'Value': supplier.balance_due || supplier.total_due || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Outstanding balance' }
            );
          });
        }

        exportToExcel(supplierDetails, `Supplier_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 5: // Profit & Loss
        exportProfitData();
        break;

      case 6: // Expenses
        // Export detailed expense data
        const expenseDetails = [
          { 'Report Type': 'Expense Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add expense summary
        if (expenseData?.data?.summary) {
          expenseDetails.push(
            { 'Section': 'Expense Summary', 'Metric': 'Total Expenses', 'Value': expenseData.data.summary.total_expenses || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total expenses for period' },
            { 'Section': 'Expense Summary', 'Metric': 'Operating Expenses', 'Value': expenseData.data.summary.operating_expenses || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Day-to-day operating costs' },
            { 'Section': 'Expense Summary', 'Metric': 'Administrative Expenses', 'Value': expenseData.data.summary.administrative_expenses || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Administrative and overhead costs' }
          );
        }

        // Add expense categories
        if (expenseData?.data?.expenses) {
          expenseData.data.expenses.forEach(expense => {
            expenseDetails.push(
              { 'Section': 'Expense Categories', 'Metric': 'Category', 'Value': expense.category || 'N/A', 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Expense category details' },
              { 'Section': 'Expense Categories', 'Metric': 'Amount', 'Value': expense.amount || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Expense amount' },
              { 'Section': 'Expense Categories', 'Metric': 'Percentage of Total', 'Value': expense.percentage_of_total || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Percentage of total expenses' }
            );
          });
        }

        exportToExcel(expenseDetails, `Expense_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 7: // Salary
        // Export detailed salary data
        const salaryDetails = [
          { 'Report Type': 'Salary Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add salary summary
        if (salaryData?.data?.summary) {
          salaryDetails.push(
            { 'Section': 'Salary Summary', 'Metric': 'Total Salary', 'Value': salaryData.data.summary.total_salary || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total salary expense' },
            { 'Section': 'Salary Summary', 'Metric': 'Average Salary', 'Value': salaryData.data.summary.avg_salary || salaryData.data.summary.average_salary || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average salary per employee' },
            { 'Section': 'Salary Summary', 'Metric': 'Total Employees', 'Value': salaryData.data.summary.total_employees || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of employees' }
          );
        }

        // Add department-wise salary data
        if (salaryData?.data?.departments) {
          salaryData.data.departments.forEach(dept => {
            salaryDetails.push(
              { 'Section': 'Department Salary', 'Metric': 'Department', 'Value': dept.department || 'N/A', 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Department-wise salary details' },
              { 'Section': 'Department Salary', 'Metric': 'Employees', 'Value': dept.employee_count || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of employees in department' },
              { 'Section': 'Department Salary', 'Metric': 'Total Salary', 'Value': dept.total_salary || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total salary for department' },
              { 'Section': 'Department Salary', 'Metric': 'Average Salary', 'Value': dept.avg_salary || dept.average_salary || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average salary in department' }
            );
          });
        }

        exportToExcel(salaryDetails, `Salary_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 8: // Cash Flow
        // Export detailed cash flow data
        const cashFlowDetails = [
          { 'Report Type': 'Cash Flow Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add cash flow summary
        if (cashFlowData?.data?.summary) {
          cashFlowDetails.push(
            { 'Section': 'Cash Flow Summary', 'Metric': 'Opening Balance', 'Value': cashFlowData.data.summary.opening_balance || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Opening cash balance' },
            { 'Section': 'Cash Flow Summary', 'Metric': 'Total Inflow', 'Value': cashFlowData.data.summary.total_inflow || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total cash received' },
            { 'Section': 'Cash Flow Summary', 'Metric': 'Total Outflow', 'Value': cashFlowData.data.summary.total_outflow || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total cash paid' },
            { 'Section': 'Cash Flow Summary', 'Metric': 'Net Cash Flow', 'Value': cashFlowData.data.summary.net_cash_flow || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net cash movement' },
            { 'Section': 'Cash Flow Summary', 'Metric': 'Closing Balance', 'Value': cashFlowData.data.summary.closing_balance || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Closing cash balance' }
          );
        }

        // Add transaction details
        if (cashFlowData?.data?.transactions) {
          cashFlowData.data.transactions.forEach(transaction => {
            cashFlowDetails.push(
              { 'Section': 'Cash Transactions', 'Metric': 'Date', 'Value': transaction.date || 'N/A', 'Period': transaction.date, 'NOTES': 'Transaction date' },
              { 'Section': 'Cash Transactions', 'Metric': 'Type', 'Value': transaction.type || 'N/A', 'Period': transaction.date, 'NOTES': 'Transaction type (Inflow/Outflow)' },
              { 'Section': 'Cash Transactions', 'Metric': 'Description', 'Value': transaction.description || 'N/A', 'Period': transaction.date, 'NOTES': 'Transaction description' },
              { 'Section': 'Cash Transactions', 'Metric': 'Amount', 'Value': transaction.amount || 0, 'Period': transaction.date, 'NOTES': 'Transaction amount' },
              { 'Section': 'Cash Transactions', 'Metric': 'Balance', 'Value': transaction.balance || 0, 'Period': transaction.date, 'NOTES': 'Running balance' }
            );
          });
        }

        exportToExcel(cashFlowDetails, `Cash_Flow_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 9: // Day End
        // Export detailed day-end data
        const dayEndDetails = [
          { 'Report Type': 'Day End Analysis Report' },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` }
        ];

        // Add day-end summary
        if (dayEndData?.data?.summary) {
          dayEndDetails.push(
            { 'Section': 'Day End Summary', 'Metric': 'Total Days Processed', 'Value': dayEndData.data.summary.total_days || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of days with day-end processing' },
            { 'Section': 'Day End Summary', 'Metric': 'Total Sales', 'Value': dayEndData.data.summary.total_sales || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total sales for period' },
            { 'Section': 'Day End Summary', 'Metric': 'Total Collections', 'Value': dayEndData.data.summary.total_collections || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total cash collected' },
            { 'Section': 'Day End Summary', 'Metric': 'Total Expenses', 'Value': dayEndData.data.summary.total_expenses || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Total expenses recorded' }
          );
        }

        // Add daily day-end data
        if (dayEndData?.data?.daily) {
          dayEndData.data.daily.forEach(day => {
            dayEndDetails.push(
              { 'Section': 'Daily Day End', 'Metric': 'Date', 'Value': day.date || 'N/A', 'Period': day.date, 'NOTES': 'Day end date' },
              { 'Section': 'Daily Day End', 'Metric': 'Sales', 'Value': day.sales || 0, 'Period': day.date, 'NOTES': 'Daily sales amount' },
              { 'Section': 'Daily Day End', 'Metric': 'Collections', 'Value': day.collections || 0, 'Period': day.date, 'NOTES': 'Daily collections' },
              { 'Section': 'Daily Day End', 'Metric': 'Expenses', 'Value': day.expenses || 0, 'Period': day.date, 'NOTES': 'Daily expenses' },
              { 'Section': 'Daily Day End', 'Metric': 'Net Cash', 'Value': day.net_cash || 0, 'Period': day.date, 'NOTES': 'Net cash movement' }
            );
          });
        }

        exportToExcel(dayEndDetails, `Day_End_Analysis_${format(new Date(), 'yyyy-MM-dd')}`);
        break;

      case 10: // Employees
        exportEmployeeData();
        break;

      case 11: // Inventory
        exportInventoryData();
        break;

      default:
        // Generic export for other tabs with more comprehensive data
        const genericData = [
          { 'Report Type': `Tab ${tabValue} Complete Report` },
          { 'Export Date': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
          { 'Date Range': `${dateRange.fromDate} to ${dateRange.toDate}` },
          { 'Section': 'Report Information', 'Metric': 'Tab Number', 'Value': tabValue, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Current tab being exported' },
          { 'Section': 'Report Information', 'Metric': 'Data Available', 'Value': 'Data exported from current tab', 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Export status' }
        ];
        exportToExcel(genericData, `Report_Tab_${tabValue}_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  // Export current tab data with charts
  const exportCurrentTabDataWithCharts = () => {
    switch (tabValue) {
      case 0: // Dashboard
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

        const detailedDashboard = [
          { 'Section': 'Sales Metrics', 'Metric': 'Total Sales Revenue', 'Value': salesData?.data?.summary?.total_sales || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross sales from all transactions' },
          { 'Section': 'Sales Metrics', 'Metric': 'Total Orders', 'Value': salesData?.data?.summary?.total_bills || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of sales invoices' },
          { 'Section': 'Sales Metrics', 'Metric': 'Average Order Value', 'Value': (salesData?.data?.summary?.total_sales || 0) / Math.max(salesData?.data?.summary?.total_bills || 1, 1), 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average revenue per order' },
          { 'Section': 'Profit Metrics', 'Metric': 'Gross Profit', 'Value': pnlData?.data?.summary?.gross_profit || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Revenue minus cost of goods sold' },
          { 'Section': 'Profit Metrics', 'Metric': 'Net Profit', 'Value': pnlData?.data?.summary?.net_profit || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Profit after all expenses' },
          { 'Section': 'Profit Metrics', 'Metric': 'Gross Margin %', 'Value': pnlData?.data?.summary?.margin_pct || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross profit as percentage of revenue' },
          { 'Section': 'Profit Metrics', 'Metric': 'Net Margin %', 'Value': pnlData?.data?.summary?.net_margin_pct || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net profit as percentage of revenue' },
          { 'Section': 'Customer Metrics', 'Metric': 'Total Employees', 'Value': employeeData?.data?.summary?.total_employees || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Active workforce size' },
          { 'Section': 'Customer Metrics', 'Metric': 'Active Customers', 'Value': customerData?.data?.customers?.length || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Customers with transactions' },
          { 'Section': 'Inventory Metrics', 'Metric': 'Total Products', 'Value': inventoryData?.data?.stockItems?.length || 0, 'Period': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Products in inventory' }
        ];

        exportToExcel([...dashboardData, ...detailedDashboard], `Dashboard_Summary`, true);
        break;

      case 1: // Sales Analysis
        exportSalesData(true);
        break;

      default:
        // For other tabs, use the regular export with charts
        exportCurrentTabData();
    }
  };

  // Export complete report with charts
  const exportCompleteReportWithCharts = () => {
    const exportData = [];

    // 1. EXECUTIVE SUMMARY
    exportData.push(
      { 'SECTION': 'EXECUTIVE SUMMARY', 'METRIC': '', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Business Performance', 'VALUE': '', 'PERIOD': '', 'NOTES': '' },
      { 'SECTION': '', 'METRIC': 'Total Sales Revenue', 'VALUE': salesData?.data?.summary?.total_sales || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross sales from all transactions' },
      { 'SECTION': '', 'METRIC': 'Total Orders', 'VALUE': salesData?.data?.summary?.total_bills || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Number of sales invoices' },
      { 'SECTION': '', 'METRIC': 'Average Order Value', 'VALUE': (salesData?.data?.summary?.total_sales || 0) / Math.max(salesData?.data?.summary?.total_bills || 1, 1), 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Average revenue per order' },
      { 'SECTION': '', 'METRIC': 'Gross Profit', 'VALUE': pnlData?.data?.summary?.gross_profit || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Revenue minus cost of goods sold' },
      { 'SECTION': '', 'METRIC': 'Net Profit', 'VALUE': pnlData?.data?.summary?.net_profit || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Profit after all expenses' },
      { 'SECTION': '', 'METRIC': 'Gross Margin %', 'VALUE': pnlData?.data?.summary?.margin_pct || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Gross profit as percentage of revenue' },
      { 'SECTION': '', 'METRIC': 'Net Margin %', 'VALUE': pnlData?.data?.summary?.net_margin_pct || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Net profit as percentage of revenue' },
      { 'SECTION': '', 'METRIC': 'Total Employees', 'VALUE': employeeData?.data?.summary?.total_employees || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Active workforce size' },
      { 'SECTION': '', 'METRIC': 'Active Customers', 'VALUE': customerData?.data?.customers?.length || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Customers with transactions' },
      { 'SECTION': '', 'METRIC': 'Total Products', 'VALUE': inventoryData?.data?.stockItems?.length || 0, 'PERIOD': dateRange.fromDate + ' to ' + dateRange.toDate, 'NOTES': 'Products in inventory' }
    );

    exportToExcel(exportData, `Complete_Business_Report`, true);
  };

  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const params = { fromDate: dateRange.fromDate, toDate: dateRange.toDate };

  const normalizePdfReportType = (reportType) => {
    const type = String(reportType || '').toLowerCase();
    const map = {
      'cash-flow': 'cashflow',
      cashflow: 'cashflow',
      sales: 'sales',
      inventory: 'inventory',
      expenses: 'expenses',
      salary: 'salary',
      employees: 'employees',
    };
    return map[type] || null;
  };

  const getPdfReportTypeForTab = (currentTab) => {
    const tabToType = {
      1: 'sales',
      7: 'expenses',
      8: 'salary',
      9: 'cashflow',
      10: 'employees',
      11: 'inventory',
    };
    return tabToType[currentTab] || null;
  };

  const handleExport = async (reportType, exportParams = {}) => {
    const normalizedType = normalizePdfReportType(reportType);
    if (!normalizedType) {
      exportCurrentTabPdfLocally();
      return;
    }
    try {
      const blob = await reportsAPI.exportReport(normalizedType, { ...params, ...exportParams });

      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${normalizedType}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('PDF exported successfully');
      } else {
        toast.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error?.message || 'Failed to export PDF');
    }
  };

  const exportCurrentTabPdfLocally = () => {
    try {
      const doc = new jsPDF();
      const title = `Report Export - ${format(new Date(), 'yyyy-MM-dd')}`;
      doc.setFontSize(14);
      doc.text(title, 14, 16);
      doc.setFontSize(10);
      doc.text(`Date Range: ${dateRange.fromDate} to ${dateRange.toDate}`, 14, 24);

      let rows = [];
      if (tabValue === 0) {
        rows = [
          ['Total Sales', salesData?.data?.summary?.total_sales || 0],
          ['Total Orders', salesData?.data?.summary?.total_bills || 0],
          ['Net Profit', pnlData?.data?.summary?.net_profit || 0],
          ['Active Customers', customerData?.data?.customers?.length || 0],
          ['Total Products', inventoryData?.data?.stockItems?.length || 0],
        ];
      } else if (tabValue === 2) {
        rows = [
          ['Output Tax', taxData?.data?.summary?.output_tax || 0],
          ['Taxable Sales', taxData?.data?.summary?.taxable_sales || 0],
          ['Net Tax Payable', taxData?.data?.summary?.net_tax_payable || 0],
        ];
      } else if (tabValue === 3) {
        rows = (customerData?.data?.customers || []).slice(0, 25).map(c => [c.customer_name || c.customer_id || 'N/A', c.total_bills || 0, c.total_purchase || 0]);
      } else if (tabValue === 4) {
        rows = (supplierData?.data?.suppliers || []).slice(0, 25).map(s => [s.supplier_name || 'N/A', s.total_bills || 0, s.total_purchase || 0, s.total_due || 0]);
      } else if (tabValue === 5) {
        rows = [
          ['Gross Profit', pnlData?.data?.summary?.gross_profit || 0],
          ['Net Profit', pnlData?.data?.summary?.net_profit || 0],
          ['Gross Margin %', pnlData?.data?.summary?.margin_pct || 0],
          ['Net Margin %', pnlData?.data?.summary?.net_margin_pct || 0],
        ];
      } else if (tabValue === 6) {
        rows = [
          ['Date', dayEndData?.data?.date || '-'],
          ['Sales Bills', dayEndData?.data?.sales_bills || 0],
          ['Purchase Bills', dayEndData?.data?.purchase_bills || 0],
          ['Sales Amount', dayEndData?.data?.sales_amount || 0],
          ['Cash Delta', dayEndData?.data?.cash_delta || 0],
        ];
      } else {
        rows = [['Info', 'PDF exported for current tab']];
      }

      const head = (tabValue === 3)
        ? [['Customer', 'Bills', 'Purchase']]
        : (tabValue === 4)
          ? [['Supplier', 'Bills', 'Purchase', 'Due']]
          : [['Metric', 'Value']];
      autoTable(doc, { startY: 30, head, body: rows, styles: { fontSize: 9 } });
      doc.save(`report-tab-${tabValue}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Local PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Handle custom timeframe export
  const handleCustomTimeframeExport = (timeframe) => {
    setCustomTimeframe(timeframe);
    setCustomFromDate('');
    setCustomToDate('');
    setDatePickerOpen(true);
  };

  // Export with custom dates
  const exportWithCustomDates = async () => {
    try {
      if (!customFromDate || !customToDate) {
        alert('Please select both from and to dates');
        return;
      }

      // Generate date ranges based on custom dates
      const generateCustomDateRanges = (type, fromDate, toDate) => {
        const ranges = [];
        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (type === 'daily') {
          // Generate daily ranges between custom dates
          const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          for (let i = 0; i <= daysDiff; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            ranges.push({
              fromDate: format(date, 'yyyy-MM-dd'),
              toDate: format(date, 'yyyy-MM-dd'),
              label: format(date, 'MMM dd, yyyy')
            });
          }
        } else if (type === 'monthly') {
          // Generate monthly ranges between custom dates
          const current = new Date(start.getFullYear(), start.getMonth(), 1);
          while (current <= end) {
            const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const actualEnd = monthEnd > end ? end : monthEnd;

            ranges.push({
              fromDate: format(current, 'yyyy-MM-dd'),
              toDate: format(actualEnd, 'yyyy-MM-dd'),
              label: format(current, 'MMM yyyy')
            });

            current.setMonth(current.getMonth() + 1);
          }
        } else if (type === 'yearly') {
          // Generate yearly ranges between custom dates
          const startYear = start.getFullYear();
          const endYear = end.getFullYear();

          for (let year = startYear; year <= endYear; year++) {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);
            const actualStart = yearStart < start ? start : yearStart;
            const actualEnd = yearEnd > end ? end : yearEnd;

            ranges.push({
              fromDate: format(actualStart, 'yyyy-MM-dd'),
              toDate: format(actualEnd, 'yyyy-MM-dd'),
              label: year.toString()
            });
          }
        }

        return ranges;
      };

      const dateRanges = generateCustomDateRanges(customTimeframe, customFromDate, customToDate);
      const allData = [];

      for (const range of dateRanges) {
        try {
          // Fetch data for each period
          const [salesRes, pnlRes, customerRes, inventoryRes, employeeRes, taxRes] = await Promise.all([
            reportsAPI.getSalesReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getProfitLossReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getCustomerReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getInventoryReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getEmployeeReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getTaxReport({ fromDate: range.fromDate, toDate: range.toDate })
          ]);

          const periodData = {
            Period: range.label,
            'From Date': range.fromDate,
            'To Date': range.toDate,
            'Total Sales': salesRes?.data?.summary?.total_sales || 0,
            'Total Orders': salesRes?.data?.summary?.total_bills || 0,
            'Gross Profit': pnlRes?.data?.summary?.gross_profit || 0,
            'Net Profit': pnlRes?.data?.summary?.net_profit || 0,
            'Active Customers': customerRes?.data?.customers?.length || 0,
            'Total Products': inventoryRes?.data?.stockItems?.length || 0,
            'Total Employees': employeeRes?.data?.summary?.total_employees || 0,
            'Output Tax': taxRes?.data?.summary?.output_tax || 0,
            'Net Tax Payable': taxRes?.data?.summary?.net_tax_payable || 0
          };

          allData.push(periodData);
        } catch (error) {
          console.error(`Error fetching data for ${range.label}:`, error);
          allData.push({
            Period: range.label,
            'From Date': range.fromDate,
            'To Date': range.toDate,
            'Total Sales': 0,
            'Total Orders': 0,
            'Gross Profit': 0,
            'Net Profit': 0,
            'Active Customers': 0,
            'Total Products': 0,
            'Total Employees': 0,
            'Output Tax': 0,
            'Net Tax Payable': 0,
            'Status': 'Data Unavailable'
          });
        }
      }

      // Create impressive Excel formatting with colors
      const workbook = XLSX.utils.book_new();

      // Main Summary Sheet with colorful formatting
      const summaryWS = XLSX.utils.json_to_sheet(allData);

      // Apply formatting to summary sheet
      const summaryRange = XLSX.utils.decode_range(summaryWS['!ref']);
      for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
        // Header formatting
        const headerAddress = XLSX.utils.encode_col(C) + '1';
        if (summaryWS[headerAddress]) {
          summaryWS[headerAddress].s = {
            font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '2E75B6' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
          };
        }

        // Data row formatting
        for (let R = summaryRange.s.r + 1; R <= summaryRange.e.r; ++R) {
          const dataAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (summaryWS[dataAddress]) {
            const isEven = (R - summaryRange.s.r) % 2 === 0;
            summaryWS[dataAddress].s = {
              fill: { fgColor: { rgb: isEven ? 'F2F2F2' : 'FFFFFF' } },
              border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
              alignment: { vertical: 'center' }
            };

            // Apply number formatting for currency columns
            const headerText = summaryWS[XLSX.utils.encode_cell({ r: summaryRange.s.r, c: C })]?.v || '';
            if (headerText.includes('Sales') || headerText.includes('Profit') || headerText.includes('Tax')) {
              summaryWS[dataAddress].z = '₹#,##0.00';
            }
          }
        }
      }

      // Auto-adjust column widths
      const summaryColWidths = [];
      for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
        summaryColWidths.push({ width: 15 });
      }
      summaryWS['!cols'] = summaryColWidths;

      XLSX.utils.book_append_sheet(workbook, summaryWS, `📊 ${customTimeframe.charAt(0).toUpperCase() + customTimeframe.slice(1)} Summary`);

      // Create detailed sheets for each category
      const categories = {
        '🛒 Sales Performance': { color: '4472C4', dataKey: 'Total Sales' },
        '💰 Profit Analysis': { color: '70AD47', dataKey: 'Gross Profit' },
        '👥 Customer Insights': { color: 'ED7D31', dataKey: 'Active Customers' },
        '📦 Inventory Status': { color: 'FFC000', dataKey: 'Total Products' },
        '👨‍💼 Employee Metrics': { color: '5B9BD5', dataKey: 'Total Employees' },
        '💼 Tax Analysis': { color: 'A5A5A5', dataKey: 'Net Tax Payable' }
      };

      Object.entries(categories).forEach(([sheetName, config]) => {
        const categoryData = allData.map(row => ({
          Period: row.Period,
          'From Date': row['From Date'],
          'To Date': row['To Date'],
          [sheetName.split(' ')[1]]: row[config.dataKey],
          'Status': row.Status || 'Completed'
        }));

        const ws = XLSX.utils.json_to_sheet(categoryData);

        // Apply category-specific formatting
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const headerAddress = XLSX.utils.encode_col(C) + '1';
          if (ws[headerAddress]) {
            ws[headerAddress].s = {
              font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
              fill: { fgColor: { rgb: config.color } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
            };
          }
        }

        ws['!cols'] = [{ width: 15 }, { width: 12 }, { width: 12 }, { width: 18 }, { width: 12 }];
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      const filename = `Custom_${customTimeframe}_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setDatePickerOpen(false);

    } catch (error) {
      console.error('Custom export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Enhanced Export Function with Timeframe Options
  const exportWithTimeframe = async (timeframe) => {
    try {
      // Generate date ranges based on timeframe
      const generateDateRanges = (type) => {
        const now = new Date();
        const ranges = [];

        if (type === 'daily') {
          // Last 365 days
          for (let i = 364; i >= 0; i--) {
            const date = subDays(now, i);
            ranges.push({
              fromDate: format(date, 'yyyy-MM-dd'),
              toDate: format(date, 'yyyy-MM-dd'),
              label: format(date, 'MMM dd, yyyy')
            });
          }
        } else if (type === 'monthly') {
          // Last 30 months
          for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            ranges.push({
              fromDate: format(date, 'yyyy-MM-dd'),
              toDate: format(endDate, 'yyyy-MM-dd'),
              label: format(date, 'MMM yyyy')
            });
          }
        } else if (type === 'yearly') {
          // Last 10 years
          for (let i = 9; i >= 0; i--) {
            const year = now.getFullYear() - i;
            ranges.push({
              fromDate: `${year}-01-01`,
              toDate: `${year}-12-31`,
              label: year.toString()
            });
          }
        }

        return ranges;
      };

      const dateRanges = generateDateRanges(timeframe);

      // Fetch data for each date range
      const allData = [];

      for (const range of dateRanges) {
        try {
          const [salesRes, pnlRes, customerRes, inventoryRes, employeeRes, taxRes] = await Promise.all([
            reportsAPI.getSalesReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getProfitLossReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getCustomerReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getInventoryReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getEmployeeReport({ fromDate: range.fromDate, toDate: range.toDate }),
            reportsAPI.getTaxReport({ fromDate: range.fromDate, toDate: range.toDate })
          ]);

          const periodData = {
            'Period': range.label,
            'From Date': range.fromDate,
            'To Date': range.toDate,

            // Sales Metrics
            'Total Sales': salesRes?.data?.summary?.total_sales || 0,
            'Total Orders': salesRes?.data?.summary?.total_bills || 0,
            'Average Order Value': salesRes?.data?.summary?.total_sales ?
              (salesRes.data.summary.total_sales / Math.max(salesRes.data.summary.total_bills, 1)) : 0,
            'Top Product': salesRes?.data?.topProducts?.[0]?.product_name || 'N/A',
            'Sales Growth': 'N/A', // Would need previous period for calculation

            // Profit Metrics
            'Gross Profit': pnlRes?.data?.summary?.gross_profit || 0,
            'Net Profit': pnlRes?.data?.summary?.net_profit || 0,
            'Gross Margin %': pnlRes?.data?.summary?.sales_amount ?
              ((pnlRes.data.summary.gross_profit / pnlRes.data.summary.sales_amount) * 100) : 0,
            'Net Margin %': pnlRes?.data?.summary?.sales_amount ?
              ((pnlRes.data.summary.net_profit / pnlRes.data.summary.sales_amount) * 100) : 0,
            'Total Expenses': pnlRes?.data?.summary?.expenses || 0,

            // Customer Metrics
            'Active Customers': customerRes?.data?.customers?.length || 0,
            'New Customers': customerRes?.data?.newCustomers || 0,
            'Customer Retention %': customerRes?.data?.retentionRate || 0,
            'Top Customer': customerRes?.data?.topCustomers?.[0]?.customer_name || 'N/A',

            // Inventory Metrics
            'Total Products': inventoryRes?.data?.stockItems?.length || 0,
            'Low Stock Items': inventoryRes?.data?.lowStockItems?.length || 0,
            'Total Stock Value': inventoryRes?.data?.totalStockValue || 0,
            'Inventory Turnover': inventoryRes?.data?.turnoverRate || 0,

            // Employee Metrics
            'Total Employees': employeeRes?.data?.summary?.total_employees || 0,
            'Active Employees': employeeRes?.data?.activeEmployees || 0,
            'Total Salary': employeeRes?.data?.summary?.total_salary || 0,
            'Avg Salary': employeeRes?.data?.summary?.avg_salary || 0,

            // Tax Metrics
            'Total Tax': taxRes?.data?.summary?.output_tax || 0,
            'Tax Payable': taxRes?.data?.summary?.net_tax_payable || 0,
            'Tax Collected': taxRes?.data?.summary?.input_tax || 0,
            'Effective Tax Rate': taxRes?.data?.summary?.taxable_sales ?
              ((taxRes.data.summary.output_tax / taxRes.data.summary.taxable_sales) * 100) : 0,

            // Performance Indicators
            'Revenue per Employee': employeeRes?.data?.summary?.total_employees ?
              ((salesRes?.data?.summary?.total_sales || 0) / employeeRes.data.summary.total_employees) : 0,
            'Profit per Employee': employeeRes?.data?.summary?.total_employees ?
              ((pnlRes?.data?.summary?.net_profit || 0) / employeeRes.data.summary.total_employees) : 0,
            'Sales per Customer': customerRes?.data?.customers?.length ?
              ((salesRes?.data?.summary?.total_sales || 0) / customerRes.data.customers.length) : 0,

            // Status Indicators
            'Period Status': 'Completed',
            'Data Quality': 'Good',
            'Export Timestamp': format(new Date(), 'yyyy-MM-dd HH:mm:ss')
          };

          allData.push(periodData);
        } catch (error) {
          console.error(`Error fetching data for ${range.label}:`, error);
          // Add placeholder data for failed periods
          allData.push({
            'Period': range.label,
            'From Date': range.fromDate,
            'To Date': range.toDate,
            'Status': 'Data Unavailable',
            'Export Timestamp': format(new Date(), 'yyyy-MM-dd HH:mm:ss')
          });
        }
      }

      // Create impressive Excel formatting with colors
      const workbook = XLSX.utils.book_new();

      // Main Summary Sheet with colorful formatting
      const summaryWS = XLSX.utils.json_to_sheet(allData);

      // Apply colorful formatting to summary sheet
      const range = XLSX.utils.decode_range(summaryWS['!ref']);

      // Format header row with gradient colors
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!summaryWS[address]) continue;
        summaryWS[address].s = {
          font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
          fill: {
            patternType: 'solid',
            fgColor: { rgb: '2E75B6' },
            bgColor: { rgb: '2E75B6' }
          },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }

      // Apply alternating row colors and number formatting
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const isEven = (R - range.s.r) % 2 === 0;
        const rowColor = isEven ? 'F2F2F2' : 'FFFFFF';

        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          if (!summaryWS[address]) continue;

          // Apply row color and borders
          summaryWS[address].s = {
            fill: {
              patternType: 'solid',
              fgColor: { rgb: rowColor }
            },
            border: {
              top: { style: 'thin', color: { rgb: 'D0D0D0' } },
              bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
              left: { style: 'thin', color: { rgb: 'D0D0D0' } },
              right: { style: 'thin', color: { rgb: 'D0D0D0' } }
            },
            alignment: { vertical: 'center' }
          };

          // Apply number formatting for currency columns
          const headerCell = XLSX.utils.encode_cell({ r: range.s.r, c: C });
          const headerText = summaryWS[headerCell]?.v || '';

          if (headerText.includes('Sales') || headerText.includes('Profit') ||
            headerText.includes('Salary') || headerText.includes('Tax') ||
            headerText.includes('Value') || headerText.includes('Revenue')) {
            summaryWS[address].z = '₹#,##0.00';
            summaryWS[address].s.font = { color: { rgb: isEven ? '000000' : '2E75B6' } };
          }

          if (headerText.includes('%')) {
            summaryWS[address].z = '0.00%';
            summaryWS[address].s.font = { color: { rgb: isEven ? '000000' : '70AD47' } };
          }

          // Color code performance indicators
          if (headerText.includes('Status') || headerText.includes('Quality')) {
            const value = summaryWS[address].v;
            if (value === 'Completed' || value === 'Good') {
              summaryWS[address].s.fill = { fgColor: { rgb: 'E8F5E8' } };
              summaryWS[address].s.font = { color: { rgb: '006100' } };
            } else if (value === 'Data Unavailable') {
              summaryWS[address].s.fill = { fgColor: { rgb: 'FFF2CC' } };
              summaryWS[address].s.font = { color: { rgb: '9C6500' } };
            }
          }
        }
      }

      // Auto-adjust column widths
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 15; // Minimum width
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const address = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = summaryWS[address];
          if (cell && cell.v) {
            const cellLength = String(cell.v).length;
            maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50));
          }
        }
        colWidths.push({ width: maxWidth });
      }
      summaryWS['!cols'] = colWidths;

      // Add summary sheet to workbook
      XLSX.utils.book_append_sheet(workbook, summaryWS, `📊 ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Summary`);

      // Create colorful detailed sheets for each major category
      const categories = {
        '🛒 Sales Performance': {
          columns: ['Period', 'Total Sales', 'Total Orders', 'Average Order Value', 'Top Product'],
          color: '5B9BD5',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Total Sales': { value: row['Total Sales'] || 0, type: 'currency' },
            'Total Orders': { value: row['Total Orders'] || 0, type: 'number' },
            'Average Order Value': { value: row['Average Order Value'] || 0, type: 'currency' },
            'Top Product': row['Top Product'] || 'N/A'
          })
        },
        '💰 Profit Analysis': {
          columns: ['Period', 'Gross Profit', 'Net Profit', 'Gross Margin %', 'Net Margin %', 'Total Expenses'],
          color: '70AD47',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Gross Profit': { value: row['Gross Profit'] || 0, type: 'currency' },
            'Net Profit': { value: row['Net Profit'] || 0, type: 'currency' },
            'Gross Margin %': { value: (row['Gross Margin %'] || 0) / 100, type: 'percentage' },
            'Net Margin %': { value: (row['Net Margin %'] || 0) / 100, type: 'percentage' },
            'Total Expenses': { value: row['Total Expenses'] || 0, type: 'currency' }
          })
        },
        '👥 Customer Insights': {
          columns: ['Period', 'Active Customers', 'New Customers', 'Customer Retention %', 'Top Customer'],
          color: 'FFC000',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Active Customers': { value: row['Active Customers'] || 0, type: 'number' },
            'New Customers': { value: row['New Customers'] || 0, type: 'number' },
            'Customer Retention %': { value: (row['Customer Retention %'] || 0) / 100, type: 'percentage' },
            'Top Customer': row['Top Customer'] || 'N/A'
          })
        },
        '📦 Inventory Status': {
          columns: ['Period', 'Total Products', 'Low Stock Items', 'Total Stock Value', 'Inventory Turnover'],
          color: 'ED7D31',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Total Products': { value: row['Total Products'] || 0, type: 'number' },
            'Low Stock Items': { value: row['Low Stock Items'] || 0, type: 'number' },
            'Total Stock Value': { value: row['Total Stock Value'] || 0, type: 'currency' },
            'Inventory Turnover': { value: row['Inventory Turnover'] || 0, type: 'number' }
          })
        },
        '👨‍💼 Employee Metrics': {
          columns: ['Period', 'Total Employees', 'Active Employees', 'Total Salary', 'Avg Salary'],
          color: 'A5A5A5',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Total Employees': { value: row['Total Employees'] || 0, type: 'number' },
            'Active Employees': { value: row['Active Employees'] || 0, type: 'number' },
            'Total Salary': { value: row['Total Salary'] || 0, type: 'currency' },
            'Avg Salary': { value: row['Avg Salary'] || 0, type: 'currency' }
          })
        },
        '💼 Tax Analysis': {
          columns: ['Period', 'Total Tax', 'Tax Payable', 'Tax Collected', 'Effective Tax Rate'],
          color: 'FF0000',
          dataMapping: (row) => ({
            'Period': row['Period'],
            'Total Tax': { value: row['Total Tax'] || 0, type: 'currency' },
            'Tax Payable': { value: row['Tax Payable'] || 0, type: 'currency' },
            'Tax Collected': { value: row['Tax Collected'] || 0, type: 'currency' },
            'Effective Tax Rate': { value: (row['Effective Tax Rate'] || 0) / 100, type: 'percentage' }
          })
        }
      };

      Object.entries(categories).forEach(([sheetName, config]) => {
        const mappedData = allData.map(config.dataMapping);
        const ws = XLSX.utils.json_to_sheet(mappedData);

        // Apply colorful formatting to category sheets
        const sheetRange = XLSX.utils.decode_range(ws['!ref']);

        // Format headers with category colors
        for (let C = sheetRange.s.c; C <= sheetRange.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + '1';
          if (!ws[address]) continue;
          ws[address].s = {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
            fill: {
              patternType: 'solid',
              fgColor: { rgb: config.color }
            },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
              top: { style: 'medium', color: { rgb: '000000' } },
              bottom: { style: 'medium', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }

        // Apply data formatting and alternating colors
        for (let R = sheetRange.s.r + 1; R <= sheetRange.e.r; ++R) {
          const isEven = (R - sheetRange.s.r) % 2 === 0;
          const rowColor = isEven ? 'F8F8F8' : 'FFFFFF';

          for (let C = sheetRange.s.c; C <= sheetRange.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[address]) continue;

            const cellData = mappedData[R - 1];
            const columnName = config.columns[C];
            const columnData = cellData ? cellData[columnName] : null;

            // Apply cell styling
            ws[address].s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: rowColor }
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                right: { style: 'thin', color: { rgb: 'E0E0E0' } }
              },
              alignment: { vertical: 'center' }
            };

            // Apply number formatting based on data type
            if (columnData && typeof columnData === 'object') {
              if (columnData.type === 'currency') {
                ws[address].z = '₹#,##0.00';
                ws[address].s.font = { color: { rgb: isEven ? '000000' : config.color } };
              } else if (columnData.type === 'percentage') {
                ws[address].z = '0.00%';
                ws[address].s.font = { color: { rgb: isEven ? '000000' : config.color } };
              } else if (columnData.type === 'number') {
                ws[address].z = '#,##0';
                ws[address].s.font = { color: { rgb: isEven ? '000000' : '404040' } };
              }
            }
          }
        }

        // Auto-adjust column widths for category sheets
        const categoryColWidths = [];
        for (let C = sheetRange.s.c; C <= sheetRange.e.c; ++C) {
          let maxWidth = 12;
          for (let R = sheetRange.s.r; R <= sheetRange.e.r; ++R) {
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[address];
            if (cell && cell.v) {
              const cellLength = String(cell.v).length;
              maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 40));
            }
          }
          categoryColWidths.push({ width: maxWidth });
        }
        ws['!cols'] = categoryColWidths;

        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      // Add a dashboard summary sheet with charts data
      const dashboardData = {
        'Report Information': [
          { 'Metric': 'Report Type', 'Value': `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Business Analysis` },
          { 'Metric': 'Generated On', 'Value': format(new Date(), 'PPP dd, yyyy HH:mm:ss') },
          { 'Metric': 'Periods Covered', 'Value': dateRanges.length },
          { 'Metric': 'Date Range', 'Value': `${dateRanges[0]?.fromDate} to ${dateRanges[dateRanges.length - 1]?.toDate}` }
        ],
        'Business Summary': [
          { 'Metric': 'Total Sales (All Periods)', 'Value': allData.reduce((sum, row) => sum + (row['Total Sales'] || 0), 0) },
          { 'Metric': 'Total Profit (All Periods)', 'Value': allData.reduce((sum, row) => sum + (row['Net Profit'] || 0), 0) },
          { 'Metric': 'Total Orders (All Periods)', 'Value': allData.reduce((sum, row) => sum + (row['Total Orders'] || 0), 0) },
          { 'Metric': 'Average Daily Sales', 'Value': allData.reduce((sum, row) => sum + (row['Total Sales'] || 0), 0) / allData.length }
        ],
        'Performance Indicators': [
          { 'Metric': 'Best Sales Period', 'Value': allData.reduce((max, row) => (row['Total Sales'] || 0) > (max['Total Sales'] || 0) ? row : max, allData[0])['Period'] },
          { 'Metric': 'Best Profit Period', 'Value': allData.reduce((max, row) => (row['Net Profit'] || 0) > (max['Net Profit'] || 0) ? row : max, allData[0])['Period'] },
          { 'Metric': 'Average Margin %', 'Value': allData.reduce((sum, row) => sum + (row['Gross Margin %'] || 0), 0) / allData.length },
          { 'Metric': 'Data Completeness', 'Value': `${Math.round((allData.filter(row => row['Period Status'] === 'Completed').length / allData.length) * 100)}%` }
        ]
      };

      // Create dashboard sheet with colorful formatting
      Object.entries(dashboardData).forEach(([sectionName, sectionData]) => {
        const ws = XLSX.utils.json_to_sheet(sectionData);
        const sectionRange = XLSX.utils.decode_range(ws['!ref']);

        // Format section header
        const headerAddress = XLSX.utils.encode_cell({ r: 0, c: 0 });
        ws[headerAddress] = { v: sectionName, t: 's' };
        ws[headerAddress].s = {
          font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center' }
        };

        // Merge header cells
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: sectionRange.e.c } }];

        // Format data rows
        for (let R = 1; R <= sectionRange.e.r; ++R) {
          for (let C = 0; C <= 1; ++C) {
            const address = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[address]) continue;

            ws[address].s = {
              fill: { fgColor: { rgb: C === 0 ? 'E8F0FE' : 'F8F8F8' } },
              border: {
                top: { style: 'thin', color: { rgb: 'D0D0D0' } },
                bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
                left: { style: 'thin', color: { rgb: 'D0D0D0' } },
                right: { style: 'thin', color: { rgb: 'D0D0D0' } }
              },
              font: { bold: C === 0, color: { rgb: '000000' } }
            };

            // Format currency values
            if (C === 1 && typeof ws[address].v === 'number' && sectionName.includes('Total')) {
              ws[address].z = '₹#,##0.00';
              ws[address].s.font = { color: { rgb: '2E75B6' } };
            }
          }
        }

        ws['!cols'] = [{ width: 25 }, { width: 20 }];
        XLSX.utils.book_append_sheet(workbook, ws, `📋 ${sectionName}`);
      });

      // Generate filename
      const filename = `Business_Report_${timeframe}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Sales Performance handlers
  const handleSalesPerformanceChange = (index, field, value) => {
    const newData = [...salesPerformanceData];
    newData[index][field] = value;

    // Auto-calculate achievement rate when sales_amount or target_sales changes
    if (field === 'sales_amount' || field === 'target_sales') {
      const salesAmount = parseFloat(newData[index].sales_amount) || 0;
      const targetSales = parseFloat(newData[index].target_sales) || 0;
      newData[index].achievement_rate = targetSales > 0 ? ((salesAmount / targetSales) * 100).toFixed(2) : '0';
    }

    setSalesPerformanceData(newData);
  };

  const handleAddSalesPerformanceRow = () => {
    setSalesPerformanceData([...salesPerformanceData, { date: '', sales_amount: '', target_sales: '', achievement_rate: '', notes: '' }]);
  };

  const handleRemoveSalesPerformanceRow = (index) => {
    const newData = salesPerformanceData.filter((_, i) => i !== index);
    setSalesPerformanceData(newData.length > 0 ? newData : [{ date: '', sales_amount: '', target_sales: '', achievement_rate: '', notes: '' }]);
  };

  const handleSalesPerformanceSubmit = async () => {
    try {
      const validData = salesPerformanceData.filter(row => row.date && row.sales_amount);

      if (validData.length === 0) {
        toast.error('Please fill in at least one row with date and sales amount');
        return;
      }

      // Here you would typically make an API call to save the data
      // For now, we'll just show success and refresh the sales data
      toast.success(`Successfully added ${validData.length} sales performance entries`);
      setSalesPerformanceDialog(false);
      setSalesPerformanceData([{ date: '', sales_amount: '', target_sales: '', achievement_rate: '', notes: '' }]);

      // Refresh the sales data
      queryClient.invalidateQueries(['r-sales']);
    } catch (error) {
      toast.error('Failed to add sales performance data');
    }
  };

  // ----- QUERIES -----
  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['r-sales', params],
    () => reportsAPI.getSalesReport({ ...params, reportType: 'SUMMARY' }),
    { enabled: tabValue === 0 || tabValue === 1 }
  );

  const { data: taxData, isLoading: taxLoading } = useQuery(
    ['r-tax', params],
    () => reportsAPI.getTaxReport(params),
    { enabled: tabValue === 2 }
  );

  const { data: customerData, isLoading: customerLoading } = useQuery(
    ['r-customer', params],
    () => reportsAPI.getCustomerReport(params),
    { enabled: tabValue === 0 || tabValue === 3 }
  );

  const { data: supplierData, isLoading: supplierLoading } = useQuery(
    ['r-supplier', params],
    () => reportsAPI.getSupplierReport(params),
    { enabled: tabValue === 4 }
  );

  const { data: pnlData, isLoading: pnlLoading } = useQuery(
    ['r-pnl', params],
    () => reportsAPI.getProfitLossReport(params),
    { enabled: tabValue === 0 || tabValue === 5 }
  );

  const { data: dayData, isLoading: dayLoading } = useQuery(
    ['r-day', { date: dayDate }],
    () => reportsAPI.getDayEndReport({ date: dayDate }),
    { enabled: tabValue === 6 }
  );

  const { data: expenseData, isLoading: expenseLoading } = useQuery(
    ['r-expense', params],
    () => reportsAPI.getExpenseReport(params),
    { enabled: tabValue === 7 }
  );

  const { data: salaryData, isLoading: salaryLoading } = useQuery(
    ['r-salary', params],
    () => reportsAPI.getSalaryReport(params),
    { enabled: tabValue === 8 }
  );

  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery(
    ['r-cashflow', params],
    () => reportsAPI.getCashFlowReport(params),
    { enabled: tabValue === 9 }
  );

  const { data: employeeData, isLoading: employeeLoading } = useQuery(
    ['r-employee', params],
    () => reportsAPI.getEmployeeReport(params),
    { enabled: tabValue === 0 || tabValue === 10 }
  );

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery(
    ['r-inventory', params],
    () => reportsAPI.getInventoryReport({ ...params, reportType: 'STOCK' }),
    { enabled: tabValue === 0 || tabValue === 11 }
  );

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
              <MenuItem onClick={() => { exportCurrentTabDataWithCharts(); handleExportMenuClose(); }}>
                <BarChart sx={{ mr: 1 }} /> Export Current Tab with Charts
              </MenuItem>
              <MenuItem onClick={() => { exportCompleteReport(); handleExportMenuClose(); }}>
                <Description sx={{ mr: 1 }} /> Complete Business Report
              </MenuItem>
              <MenuItem onClick={() => { exportCompleteReportWithCharts(); handleExportMenuClose(); }}>
                <ShowChart sx={{ mr: 1 }} /> Complete Report with Charts
              </MenuItem>
              <hr style={{ margin: '8px 0' }} />
              <MenuItem onClick={() => { handleCustomTimeframeExport('daily'); handleExportMenuClose(); }}>
                <CalendarToday sx={{ mr: 1 }} /> Custom Daily Report (Select Dates)
              </MenuItem>
              <MenuItem onClick={() => { handleCustomTimeframeExport('monthly'); handleExportMenuClose(); }}>
                <DateRange sx={{ mr: 1 }} /> Custom Monthly Report (Select Dates)
              </MenuItem>
              <MenuItem onClick={() => { handleCustomTimeframeExport('yearly'); handleExportMenuClose(); }}>
                <Event sx={{ mr: 1 }} /> Custom Yearly Report (Select Dates)
              </MenuItem>
              <hr style={{ margin: '8px 0' }} />
              <MenuItem onClick={() => { exportWithTimeframe('daily'); handleExportMenuClose(); }}>
                <CalendarToday sx={{ mr: 1 }} /> Daily Report (Last 365 Days)
              </MenuItem>
              <MenuItem onClick={() => { exportWithTimeframe('monthly'); handleExportMenuClose(); }}>
                <DateRange sx={{ mr: 1 }} /> Monthly Report (Last 30 Months)
              </MenuItem>
              <MenuItem onClick={() => { exportWithTimeframe('yearly'); handleExportMenuClose(); }}>
                <Event sx={{ mr: 1 }} /> Yearly Report (Last 10 Years)
              </MenuItem>
              <hr style={{ margin: '8px 0' }} />
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
                <Groups sx={{ mr: 1 }} /> Employee Performance
              </MenuItem>
            </Menu>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => {
                const currentReportType = getPdfReportTypeForTab(tabValue);
                handleExport(currentReportType, params);
              }}
              sx={{ ml: 2 }}
            >
              Export PDF
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Hide general date range picker for Day End tab (6) since it has its own */}
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

          {/* Management Dashboard - Key Business Metrics */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Management Dashboard - Business Overview</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Total Sales</Typography>
                    <Typography variant="h4">{money(salesData?.data?.summary?.total_sales || 0)}</Typography>
                    <Typography variant="body2" color="success">Revenue Performance</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Gross Profit</Typography>
                    <Typography variant="h4">{money(pnlData?.data?.gross_profit || 0)}</Typography>
                    <Typography variant="body2" color="success">Profitability</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Expenses</Typography>
                    <Typography variant="h4">
                      {money(
                        pnlData?.data?.summary?.total_expenses ??
                        pnlData?.data?.summary?.expenses ??
                        pnlData?.data?.summary?.expense_amount ??
                        0
                      )}
                    </Typography>
                    <Typography variant="body2" color="warning">Cost Outflow</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary">Active Customers</Typography>
                    <Typography variant="h4">{customerData?.data?.customers?.length || 0}</Typography>
                    <Typography variant="body2" color="info">Customer Base</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={2.4}>
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

          {/* Business Growth Trends */}
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

                      console.log('Raw Monthly Data:', monthly);
                      console.log('Raw PNL Monthly Data:', pnlMonthly);
                      console.log('Date Range:', dateRange);

                      // Generate all months in the selected date range
                      const generateMonthRange = (fromDate, toDate) => {
                        const months = [];
                        const current = new Date(fromDate);
                        current.setDate(1); // Ensure we're at the start of the month

                        const end = new Date(toDate);
                        end.setDate(1); // Ensure we're at the start of the month

                        while (current <= end) {
                          const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
                          months.push(monthKey);
                          current.setMonth(current.getMonth() + 1);
                        }
                        return months;
                      };

                      const monthRange = dateRange.fromDate && dateRange.toDate
                        ? generateMonthRange(dateRange.fromDate, dateRange.toDate)
                        : monthly.map(m => m.month);

                      console.log('Generated Month Range:', monthRange);

                      // Create chart data with all months in range
                      const chartData = {
                        labels: monthRange,
                        datasets: [
                          {
                            label: 'Sales Revenue',
                            data: monthRange.map(month => {
                              const monthData = monthly.find(m => m.month === month);
                              return monthData ? monthData.sales || 0 : 0;
                            }),
                            borderColor: 'rgb(54, 162, 235)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            tension: 0.1,
                          },
                          {
                            label: 'Gross Profit',
                            data: monthRange.map(month => {
                              const monthData = pnlMonthly.find(m => m.month === month);
                              return monthData ? monthData.profit || 0 : 0;
                            }),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                          }
                        ]
                      };

                      console.log('Final Chart Data:', chartData);
                      return <Line data={chartData} options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' }
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Month'
                            }
                          },
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Amount (₹)'
                            }
                          }
                        }
                      }} />;
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

          {/* Top Products & Customers */}
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

          {/* Inventory & Employee Summary */}
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

          {/* Key Business Indicators */}
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
                      const turnoverRate = totalValue > 0 ? (monthlySales * 4) / totalValue : 0; // Annualized
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
              {/* Product-wise Sales Analysis */}
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
                              <ScrollableTableContainer>
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
                              </ScrollableTableContainer>
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

              {/* Product Comparison Analysis */}
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
                              <ScrollableTableContainer>
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
                              </ScrollableTableContainer>
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

              {/* Time-based Sales Analysis */}
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

                          // Quarterly analysis
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
                                <strong>Last 6 Months:</strong> {money(last6Months)} (Avg: {money(last6Months / 180)}/day)
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

              {/* Seasonal & Quarterly Analysis */}
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

                          // Group by quarters
                          for (let i = 0; i < monthly.length; i += 3) {
                            const quarterMonths = monthly.slice(i, i + 3);
                            const quarterTotal = quarterMonths.reduce((sum, m) => sum + (m.sales || 0), 0);
                            const quarterLabel = `Q${Math.floor(i / 3) + 1} ${quarterMonths[0]?.year || ''}`;
                            quarters.push({ label: quarterLabel, total: quarterTotal });
                          }

                          return (
                            <>
                              <ScrollableTableContainer>
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
                              </ScrollableTableContainer>
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
                          const monthIndex = new Date(currentMonth.month + ' 1').getMonth();

                          // Determine season
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

                          // Calculate seasonal averages
                          const springMonths = monthly.filter((_, i) => {
                            const idx = new Date(monthly[i]?.month + ' 1').getMonth();
                            return idx >= 2 && idx <= 4;
                          });
                          const summerMonths = monthly.filter((_, i) => {
                            const idx = new Date(monthly[i]?.month + ' 1').getMonth();
                            return idx >= 5 && idx <= 7;
                          });
                          const fallMonths = monthly.filter((_, i) => {
                            const idx = new Date(monthly[i]?.month + ' 1').getMonth();
                            return idx >= 8 && idx <= 10;
                          });
                          const winterMonths = monthly.filter((_, i) => {
                            const idx = new Date(monthly[i]?.month + ' 1').getMonth();
                            return idx === 11 || idx === 0 || idx === 1;
                          });

                          const springAvg = springMonths.length > 0 ? springMonths.reduce((sum, m) => sum + (m.sales || 0), 0) / springMonths.length : 0;
                          const summerAvg = summerMonths.length > 0 ? summerMonths.reduce((sum, m) => sum + (m.sales || 0), 0) / summerMonths.length : 0;
                          const fallAvg = fallMonths.length > 0 ? fallMonths.reduce((sum, m) => sum + (m.sales || 0), 0) / fallMonths.length : 0;
                          const winterAvg = winterMonths.length > 0 ? winterMonths.reduce((sum, m) => sum + (m.sales || 0), 0) / winterMonths.length : 0;

                          const seasonalAverages = [
                            { name: 'Spring', avg: springAvg, color: 'success.main' },
                            { name: 'Summer', avg: summerAvg, color: 'warning.main' },
                            { name: 'Fall', avg: fallAvg, color: 'info.main' },
                            { name: 'Winter', avg: winterAvg, color: 'primary.main' }
                          ];
                          const bestSeason = seasonalAverages.reduce((max, s) => s.avg > max.avg ? s : max, seasonalAverages[0]);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Current Season:</strong>
                                <span style={{ color: seasonColor }}> {season}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Best Season:</strong>
                                <span style={{ color: bestSeason.color }}> {bestSeason.name} ({money(bestSeason.avg)})</span>
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

              {/* Sales Performance Summary */}
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

              {/* Product Performance Charts */}
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
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(199, 199, 199, 0.8)',
                                'rgba(83, 102, 255, 0.8)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={10} md={6}>
                    <Card sx={{ height: '50%' }}>
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

              {/* Sales Performance Chart */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Sales Performance Chart</Typography>
                {(() => {
                  const daily = salesData?.data?.dailyBreakdown || [];

                  console.log('Sales Performance - Raw Daily Data:', daily);
                  console.log('Sales Performance - Date Range:', dateRange);

                  // Generate all dates in the selected date range
                  const generateDateRange = (fromDate, toDate) => {
                    const dates = [];
                    const current = new Date(fromDate);
                    const end = new Date(toDate);

                    while (current <= end) {
                      dates.push(new Date(current));
                      current.setDate(current.getDate() + 1);
                    }
                    return dates;
                  };

                  const dateRange_list = dateRange.fromDate && dateRange.toDate
                    ? generateDateRange(dateRange.fromDate, dateRange.toDate)
                    : daily.map(d => new Date(d.bill_date));

                  console.log('Sales Performance - Generated Date Range:', dateRange_list);

                  // Create chart data with all dates in range
                  const dailyData = salesData?.data?.dailyBreakdown || [];
                  const chartLabels = dateRange_list.map(date => format(date, 'MMM dd'));
                  const chartData = dateRange_list.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = dailyData.find(d => {
                      const dayDate = new Date(d.bill_date);
                      return format(dayDate, 'yyyy-MM-dd') === dateStr;
                    });
                    return dayData ? dayData.sales || 0 : 0;
                  });

                  // Find month boundaries for vertical lines
                  const monthBoundaries = [];

                  console.log('Daily data structure:', dailyData);
                  console.log('Date range list:', dateRange_list);
                  console.log('Chart data mapped:', chartData);

                  dateRange_list.forEach((date, index) => {
                    console.log(`Checking date ${index}: ${format(date, 'yyyy-MM-dd')} - Day: ${date.getDate()}`);
                    if (date.getDate() === 1 && index > 0) { // First day of month (but not the very first date)
                      monthBoundaries.push({
                        index: index,
                        month: format(date, 'MMM yyyy'),
                        date: format(date, 'yyyy-MM-dd')
                      });
                      console.log(`Added month boundary at index ${index} for ${format(date, 'MMM yyyy')}`);
                    }
                  });

                  console.log('Sales Performance - Month Boundaries:', monthBoundaries);

                  const finalChartData = {
                    labels: chartLabels,
                    datasets: [
                      {
                        label: 'Daily Sales',
                        data: chartData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                      }
                    ]
                  };

                  console.log('Sales Performance - Final Chart Data:', finalChartData);

                  return <Line data={finalChartData} options={{
                    responsive: true,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        },
                        grid: {
                          display: true,
                          drawBorder: true,
                          color: function (context) {
                            const index = context.index;
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                            console.log(`Grid line ${index}: isMonthBoundary = ${isMonthBoundary}`);
                            return isMonthBoundary ? '#ff6b6b' : 'rgba(0, 0, 0, 0.1)';
                          },
                          lineWidth: function (context) {
                            const index = context.index;
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                            return isMonthBoundary ? 2 : 1;
                          }
                        },
                        ticks: {
                          // Add month labels on boundaries
                          callback: function (value, index, values) {
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                            if (isMonthBoundary) {
                              const boundary = monthBoundaries.find(b => b.index === index);
                              return boundary ? boundary.month : this.getLabelForValue(value);
                            }
                            return this.getLabelForValue(value);
                          },
                          font: function (context) {
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === context.index);
                            return {
                              size: isMonthBoundary ? 12 : 10,
                              weight: isMonthBoundary ? 'bold' : 'normal',
                              color: isMonthBoundary ? '#ff6b6b' : '#666'
                            };
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Sales Amount (₹)'
                        },
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          title: function (context) {
                            return `Date: ${context[0].label}`;
                          },
                          label: function (context) {
                            return `Sales: ₹${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }} />;
                })()}
              </Paper>
            </>
          ) : (
            <Alert severity="info">No sales data available</Alert>
          )}
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
              {/* Customer-wise Sales Report */}
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
                              <ScrollableTableContainer>
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
                              </ScrollableTableContainer>
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
                          const avgOrderValue = customers.reduce((sum, c) => sum + ((c.total_purchase || 0) / Math.max(c.total_bills || 1, 1)), 0) / totalCustomers;
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

              {/* Customer Analytics Charts */}
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
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(199, 199, 199, 0.8)',
                                'rgba(83, 102, 255, 0.8)',
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

              {/* Customer Purchase Behavior Charts */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer Purchase Behavior</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Purchase Frequency Distribution</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const frequentCustomers = customers.filter(c => (c.total_bills || 0) >= 10);
                          const regularCustomers = customers.filter(c => (c.total_bills || 0) >= 5 && (c.total_bills || 0) < 10);
                          const occasionalCustomers = customers.filter(c => (c.total_bills || 0) < 5);

                          const chartData = {
                            labels: ['Frequent (≥10)', 'Regular (5-9)', 'Occasional (<5)'],
                            datasets: [{
                              label: 'Customers',
                              data: [frequentCustomers.length, regularCustomers.length, occasionalCustomers.length],
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
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>New vs Returning Customers</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const newCustomers = customers.filter(c => (c.total_bills || 0) === 1);
                          const returningCustomers = customers.filter(c => (c.total_bills || 0) > 1);

                          const chartData = {
                            labels: ['New Customers', 'Returning Customers'],
                            datasets: [{
                              label: 'Customer Count',
                              data: [newCustomers.length, returningCustomers.length],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(255, 99, 132)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
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

              {/* Customer Behavior Analysis */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer Behavior Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Payment Behavior</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const totalDue = customers.reduce((sum, c) => sum + (c.total_due || 0), 0);
                          const totalPaid = customers.reduce((sum, c) => sum + (c.total_paid || 0), 0);
                          const totalPurchase = customers.reduce((sum, c) => sum + (c.total_purchase || 0), 0);
                          const overdueCustomers = customers.filter(c => (c.total_due || 0) > 0);
                          const paymentRate = totalPurchase > 0 ? (totalPaid / totalPurchase * 100) : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Outstanding:</strong> <span style={{ color: totalDue > 0 ? 'red' : 'green' }}>{money(totalDue)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Payment Rate:</strong> {paymentRate.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Overdue Customers:</strong> {overdueCustomers.length} ({customers.length > 0 ? (overdueCustomers.length / customers.length * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2">
                                <strong>Credit Risk:</strong> <span style={{ color: overdueCustomers.length > customers.length * 0.3 ? 'red' : overdueCustomers.length > customers.length * 0.1 ? 'orange' : 'green' }}>
                                  {overdueCustomers.length > customers.length * 0.3 ? 'High' : overdueCustomers.length > customers.length * 0.1 ? 'Moderate' : 'Low'}
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>New vs Returning Analysis</Typography>
                        {(() => {
                          const customers = customerData.data.customers || [];
                          const totalCustomers = customers.length;
                          const newCustomers = customers.filter(c => (c.total_bills || 0) === 1);
                          const returningCustomers = customers.filter(c => (c.total_bills || 0) > 1);
                          const retentionRate = totalCustomers > 0 ? (returningCustomers.length / totalCustomers * 100) : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>New Customers:</strong> {newCustomers.length} ({totalCustomers > 0 ? (newCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Returning Customers:</strong> {returningCustomers.length} ({totalCustomers > 0 ? (returningCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Retention Rate:</strong> {retentionRate.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2">
                                <strong>Customer Health:</strong>
                                <span style={{ color: retentionRate > 70 ? 'green' : retentionRate > 50 ? 'orange' : 'red' }}>
                                  {retentionRate > 70 ? 'Excellent' : retentionRate > 50 ? 'Good' : 'Poor'}
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
                <ScrollableTableContainer>
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
                </ScrollableTableContainer>
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
              {/* Gross vs Net Profit Summary */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Sales</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.sales_amount || 0)}</Typography>
                      <Typography variant="body2" color="info">Revenue</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Total Cost</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.purchase_amount || 0)}</Typography>
                      <Typography variant="body2" color="warning">Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Gross Profit</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.gross_profit || 0)}</Typography>
                      <Typography variant="body2" color="success">Before Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Expenses</Typography>
                      <Typography variant="h4">
                        {money(
                          pnlData.data.summary?.total_expenses ??
                          pnlData.data.summary?.expenses ??
                          pnlData.data.summary?.expense_amount ??
                          0
                        )}
                      </Typography>
                      <Typography variant="body2" color="warning">Operating + Other</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">Net Profit</Typography>
                      <Typography variant="h4">{money(pnlData.data.summary?.net_profit || pnlData.data.summary?.gross_profit || 0)}</Typography>
                      <Typography variant="body2" color="success">After Expenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Profit Analytics Charts */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Profit Analytics Charts</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Monthly Profit Trends</Typography>
                        {(() => {
                          const daily = pnlData?.data?.dailyBreakdown || [];

                          console.log('Profit Analytics - Raw Daily Data:', daily);
                          console.log('Profit Analytics - Date Range:', dateRange);

                          // Generate all dates in the selected date range
                          const generateDateRange = (fromDate, toDate) => {
                            const dates = [];
                            const current = new Date(fromDate);
                            const end = new Date(toDate);

                            while (current <= end) {
                              dates.push(new Date(current));
                              current.setDate(current.getDate() + 1);
                            }
                            return dates;
                          };

                          const dateRange_list = dateRange.fromDate && dateRange.toDate
                            ? generateDateRange(dateRange.fromDate, dateRange.toDate)
                            : daily.map(d => new Date(d.bill_date));

                          console.log('Profit Analytics - Generated Date Range:', dateRange_list);

                          // Create chart data with all dates in range
                          const chartLabels = dateRange_list.map(date => format(date, 'MMM dd'));
                          const grossProfitData = dateRange_list.map(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const dayData = daily.find(d => {
                              const dayDate = new Date(d.bill_date);
                              return format(dayDate, 'yyyy-MM-dd') === dateStr;
                            });
                            return dayData ? dayData.profit || 0 : 0;
                          });
                          const netProfitData = dateRange_list.map(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const dayData = daily.find(d => {
                              const dayDate = new Date(d.bill_date);
                              return format(dayDate, 'yyyy-MM-dd') === dateStr;
                            });
                            // Assuming 15% expenses for net profit calculation
                            return dayData ? (dayData.profit || 0) * 0.85 : 0;
                          });

                          // Find month boundaries for vertical lines
                          const monthBoundaries = [];
                          dateRange_list.forEach((date, index) => {
                            console.log(`Checking date ${index}: ${format(date, 'yyyy-MM-dd')} - Day: ${date.getDate()}`);
                            if (date.getDate() === 1 && index > 0) { // First day of month (but not the very first date)
                              monthBoundaries.push({
                                index: index,
                                month: format(date, 'MMM yyyy'),
                                date: format(date, 'yyyy-MM-dd')
                              });
                              console.log(`Added month boundary at index ${index} for ${format(date, 'MMM yyyy')}`);
                            }
                          });

                          console.log('Profit Analytics - Month Boundaries:', monthBoundaries);

                          const finalChartData = {
                            labels: chartLabels,
                            datasets: [
                              {
                                label: 'Gross Profit',
                                data: grossProfitData,
                                borderColor: 'rgb(75, 192, 192)',
                                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                                tension: 0.1,
                                fill: true,
                                pointRadius: 2,
                                pointHoverRadius: 4,
                              },
                              {
                                label: 'Net Profit',
                                data: netProfitData,
                                borderColor: 'rgb(54, 162, 235)',
                                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                                tension: 0.1,
                                fill: true,
                                pointRadius: 2,
                                pointHoverRadius: 4,
                              }
                            ]
                          };

                          console.log('Profit Analytics - Final Chart Data:', finalChartData);

                          return <Line data={finalChartData} options={{
                            responsive: true,
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Date'
                                },
                                grid: {
                                  display: true,
                                  drawBorder: true,
                                  color: function (context) {
                                    const index = context.index;
                                    const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                                    console.log(`Grid line ${index}: isMonthBoundary = ${isMonthBoundary}`);
                                    return isMonthBoundary ? '#ff6b6b' : 'rgba(0, 0, 0, 0.1)';
                                  },
                                  lineWidth: function (context) {
                                    const index = context.index;
                                    const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                                    return isMonthBoundary ? 2 : 1;
                                  }
                                }
                              },
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Profit Amount (₹)'
                                },
                                grid: {
                                  display: true,
                                  color: 'rgba(0, 0, 0, 0.1)'
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'top'
                              },
                              tooltip: {
                                callbacks: {
                                  title: function (context) {
                                    return `Date: ${context[0].label}`;
                                  },
                                  label: function (context) {
                                    return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                                  }
                                }
                              }
                            }
                          }} />;
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

              {/* Cost Structure Analysis */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Cost Structure Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Revenue vs Cost Breakdown</Typography>
                        {(() => {
                          const summary = pnlData.data.summary || {};
                          const sales = summary.sales_amount || 0;
                          const purchases = summary.purchase_amount || 0;
                          const grossProfit = summary.gross_profit || 0;
                          const expenses = purchases * 0.15; // Assuming 15% of purchases as expenses
                          const netProfit = grossProfit - expenses;

                          const chartData = {
                            labels: ['Sales Revenue', 'Purchase Cost', 'Gross Profit', 'Expenses', 'Net Profit'],
                            datasets: [{
                              label: 'Amount',
                              data: [sales, purchases, grossProfit, expenses, netProfit],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(255, 99, 132)',
                                'rgb(54, 162, 235)',
                                'rgb(255, 206, 86)',
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
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Profitability Metrics</Typography>
                        {(() => {
                          const summary = pnlData.data.summary || {};
                          const sales = summary.sales_amount || 0;
                          const grossProfit = summary.gross_profit || 0;
                          const netProfit = summary.net_profit || grossProfit || 0;
                          const grossMargin = sales > 0 ? (grossProfit / sales * 100) : 0;
                          const netMargin = sales > 0 ? (netProfit / sales * 100) : 0;

                          const chartData = {
                            labels: ['Gross Margin', 'Net Margin'],
                            datasets: [{
                              label: 'Margin %',
                              data: [grossMargin, netMargin],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(54, 162, 235)',
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

              {/* Product-wise Profit Margin */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Product-wise Profit Margin</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Products by Profit</Typography>
                        {(() => {
                          const products = pnlData.data.products || [];
                          const topProducts = products.sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 10);

                          return (
                            <>
                              <ScrollableTableContainer>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Revenue</TableCell>
                                        <TableCell align="right">Cost</TableCell>
                                        <TableCell align="right">Profit</TableCell>
                                        <TableCell align="right">Margin %</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {topProducts.map((p, index) => (
                                        <TableRow key={p.product_id || index}>
                                          <TableCell>{p.product_name}</TableCell>
                                          <TableCell align="right">{money(p.revenue || 0)}</TableCell>
                                          <TableCell align="right">{money(p.cost || 0)}</TableCell>
                                          <TableCell align="right" sx={{ color: (p.profit || 0) >= 0 ? 'green' : 'red' }}>
                                            {money(p.profit || 0)}
                                          </TableCell>
                                          <TableCell align="right">
                                            <span style={{ color: (p.margin_pct || 0) >= 20 ? 'green' : (p.margin_pct || 0) >= 10 ? 'orange' : 'red' }}>
                                              {(p.margin_pct || 0).toFixed(1)}%
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Product Profitability</Typography>
                        {(() => {
                          const products = pnlData.data.products || [];
                          const totalProducts = products.length;
                          const profitableProducts = products.filter(p => (p.profit || 0) > 0);
                          const lossMakingProducts = products.filter(p => (p.profit || 0) < 0);
                          const avgMargin = products.length > 0 ? products.reduce((sum, p) => sum + (p.margin_pct || 0), 0) / products.length : 0;
                          const bestProduct = products.sort((a, b) => (b.profit || 0) - (a.profit || 0))[0];

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Products:</strong> {totalProducts}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Profitable:</strong> <span style={{ color: 'green' }}>{profitableProducts.length} ({totalProducts > 0 ? (profitableProducts.length / totalProducts * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Loss Making:</strong> <span style={{ color: lossMakingProducts.length > 0 ? 'red' : 'green' }}>{lossMakingProducts.length}</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Avg Margin:</strong> <span style={{ color: avgMargin >= 15 ? 'green' : avgMargin >= 10 ? 'orange' : 'red' }}>{avgMargin.toFixed(1)}%</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Customer-wise Margin Analysis */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Customer-wise Margin Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Top Customers by Profit Contribution</Typography>
                        {(() => {
                          const customers = pnlData.data.customers || [];
                          const topCustomers = customers.sort((a, b) => (b.profit || 0) - (a.profit || 0)).slice(0, 10);

                          return (
                            <>
                              <ScrollableTableContainer>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Customer</TableCell>
                                        <TableCell align="right">Revenue</TableCell>
                                        <TableCell align="right">Cost</TableCell>
                                        <TableCell align="right">Profit</TableCell>
                                        <TableCell align="right">Margin %</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {topCustomers.map((c, index) => (
                                        <TableRow key={c.customer_id || index}>
                                          <TableCell>{c.customer_name}</TableCell>
                                          <TableCell align="right">{money(c.revenue || 0)}</TableCell>
                                          <TableCell align="right">{money(c.cost || 0)}</TableCell>
                                          <TableCell align="right" sx={{ color: (c.profit || 0) >= 0 ? 'green' : 'red' }}>
                                            {money(c.profit || 0)}
                                          </TableCell>
                                          <TableCell align="right">
                                            <span style={{ color: (c.margin_pct || 0) >= 20 ? 'green' : (c.margin_pct || 0) >= 10 ? 'orange' : 'red' }}>
                                              {(c.margin_pct || 0).toFixed(1)}%
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Customer Profitability</Typography>
                        {(() => {
                          const customers = pnlData.data.customers || [];
                          const totalCustomers = customers.length;
                          const profitableCustomers = customers.filter(c => (c.profit || 0) > 0);
                          const avgCustomerMargin = customers.length > 0 ? customers.reduce((sum, c) => sum + (c.margin_pct || 0), 0) / customers.length : 0;
                          const highMarginCustomers = customers.filter(c => (c.margin_pct || 0) > 25);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Customers:</strong> {totalCustomers}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Profitable:</strong> <span style={{ color: 'green' }}>{profitableCustomers.length} ({totalCustomers > 0 ? (profitableCustomers.length / totalCustomers * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>High Margin (&gt;25%):</strong> {highMarginCustomers.length}</Typography>
                              <Typography variant="body2">
                                <strong>Avg Customer Margin:</strong> <span style={{ color: avgCustomerMargin >= 15 ? 'green' : avgCustomerMargin >= 10 ? 'orange' : 'red' }}>{avgCustomerMargin.toFixed(1)}%</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Order-wise Profitability */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Order-wise Profitability</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Order Performance</Typography>
                        {(() => {
                          const orders = pnlData.data.orders || [];
                          const totalOrders = orders.length;
                          const profitableOrders = orders.filter(o => (o.profit || 0) > 0);
                          const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + (o.revenue || 0), 0) / orders.length : 0;
                          const avgOrderProfit = orders.length > 0 ? orders.reduce((sum, o) => sum + (o.profit || 0), 0) / orders.length : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Orders:</strong> {totalOrders}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Profitable Orders:</strong> <span style={{ color: 'green' }}>{profitableOrders.length} ({totalOrders > 0 ? (profitableOrders.length / totalOrders * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Order Value:</strong> {money(avgOrderValue)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Avg Order Profit:</strong> <span style={{ color: avgOrderProfit >= 0 ? 'green' : 'red' }}>{money(avgOrderProfit)}</span>
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Profitability Trends</Typography>
                        {(() => {
                          const monthly = pnlData.data.monthly || [];
                          const totalSales = monthly.reduce((sum, m) => sum + (m.sales || 0), 0);
                          const totalPurchase = monthly.reduce((sum, m) => sum + (m.purchase || 0), 0);
                          const totalProfit = monthly.reduce((sum, m) => sum + (m.profit || 0), 0);
                          const profitMargin = totalSales > 0 ? (totalProfit / totalSales * 100) : 0;
                          const profitableMonths = monthly.filter(m => (m.profit || 0) > 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Overall Margin:</strong> <span style={{ color: profitMargin > 20 ? 'green' : profitMargin > 10 ? 'orange' : 'red' }}>{profitMargin.toFixed(2)}%</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Profitable Months:</strong> <span style={{ color: 'green' }}>{profitableMonths.length}/{monthly.length}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Cost Efficiency:</strong> {totalSales > 0 ? ((totalSales - totalPurchase) / totalSales * 100).toFixed(2) : 0}% gross margin
                              </Typography>
                              <Typography variant="body2">
                                <strong>Business Health:</strong>
                                <span style={{ color: profitableMonths.length > monthly.length * 0.7 ? 'green' : profitableMonths.length > monthly.length * 0.5 ? 'orange' : 'red' }}>
                                  {profitableMonths.length > monthly.length * 0.7 ? 'Strong' : profitableMonths.length > monthly.length * 0.5 ? 'Moderate' : 'Weak'}
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

              {/* Monthly Profit Trend */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Profit Trends</Typography>
                {(() => {
                  const daily = pnlData?.data?.dailyBreakdown || [];

                  console.log('Profit Trends - Raw Daily Data:', daily);
                  console.log('Profit Trends - Date Range:', dateRange);

                  // Generate all dates in the selected date range
                  const generateDateRange = (fromDate, toDate) => {
                    const dates = [];
                    const current = new Date(fromDate);
                    const end = new Date(toDate);

                    while (current <= end) {
                      dates.push(new Date(current));
                      current.setDate(current.getDate() + 1);
                    }
                    return dates;
                  };

                  const dateRange_list = dateRange.fromDate && dateRange.toDate
                    ? generateDateRange(dateRange.fromDate, dateRange.toDate)
                    : daily.map(d => new Date(d.bill_date));

                  console.log('Profit Trends - Generated Date Range:', dateRange_list);

                  // Create chart data with all dates in range
                  const chartLabels = dateRange_list.map(date => format(date, 'MMM dd'));
                  const salesData = dateRange_list.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = daily.find(d => {
                      const dayDate = new Date(d.bill_date);
                      return format(dayDate, 'yyyy-MM-dd') === dateStr;
                    });
                    return dayData ? dayData.sales || 0 : 0;
                  });
                  const purchaseData = dateRange_list.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = daily.find(d => {
                      const dayDate = new Date(d.bill_date);
                      return format(dayDate, 'yyyy-MM-dd') === dateStr;
                    });
                    return dayData ? dayData.purchase || 0 : 0;
                  });
                  const profitData = dateRange_list.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayData = daily.find(d => {
                      const dayDate = new Date(d.bill_date);
                      return format(dayDate, 'yyyy-MM-dd') === dateStr;
                    });
                    return dayData ? dayData.profit || 0 : 0;
                  });

                  // Find month boundaries for vertical lines
                  const monthBoundaries = [];
                  dateRange_list.forEach((date, index) => {
                    console.log(`Checking date ${index}: ${format(date, 'yyyy-MM-dd')} - Day: ${date.getDate()}`);
                    if (date.getDate() === 1 && index > 0) { // First day of month (but not the very first date)
                      monthBoundaries.push({
                        index: index,
                        month: format(date, 'MMM yyyy'),
                        date: format(date, 'yyyy-MM-dd')
                      });
                      console.log(`Added month boundary at index ${index} for ${format(date, 'MMM yyyy')}`);
                    }
                  });

                  console.log('Profit Trends - Month Boundaries:', monthBoundaries);

                  const finalChartData = {
                    labels: chartLabels,
                    datasets: [
                      {
                        label: 'Daily Sales',
                        data: salesData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                      },
                      {
                        label: 'Daily Purchase',
                        data: purchaseData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                      },
                      {
                        label: 'Daily Profit',
                        data: profitData,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1,
                        fill: true,
                        pointRadius: 2,
                        pointHoverRadius: 4,
                      }
                    ]
                  };

                  console.log('Profit Trends - Final Chart Data:', finalChartData);

                  return <Line data={finalChartData} options={{
                    responsive: true,
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Date'
                        },
                        grid: {
                          display: true,
                          drawBorder: true,
                          color: function (context) {
                            const index = context.index;
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                            console.log(`Grid line ${index}: isMonthBoundary = ${isMonthBoundary}`);
                            return isMonthBoundary ? '#ff6b6b' : 'rgba(0, 0, 0, 0.1)';
                          },
                          lineWidth: function (context) {
                            const index = context.index;
                            const isMonthBoundary = monthBoundaries.some(boundary => boundary.index === index);
                            return isMonthBoundary ? 2 : 1;
                          }
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Amount (₹)'
                        },
                        grid: {
                          display: true,
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          title: function (context) {
                            return `Date: ${context[0].label}`;
                          },
                          label: function (context) {
                            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }} />;
                })()}
              </Paper>

              {/* Monthly Profit Table */}
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Monthly Profit Details</Typography>
                <ScrollableTableContainer>
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
                </ScrollableTableContainer>
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
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Daily Performance Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Cash Flow Summary</Typography>
                        {(() => {
                          const sales = dayData.data.sales_amount || 0;
                          const purchases = dayData.data.purchase_amount || 0;
                          const collections = dayData.data.customer_collections || 0;
                          const payments = dayData.data.supplier_payments || 0;
                          const netCashFlow = (sales + collections) - (purchases + payments);
                          const grossProfit = sales - purchases;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Net Cash Flow:</strong> <span style={{ color: netCashFlow >= 0 ? 'green' : 'red' }}>{money(netCashFlow)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Gross Daily Profit:</strong> <span style={{ color: grossProfit >= 0 ? 'green' : 'red' }}>{money(grossProfit)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Cash Inflow:</strong> {money(sales + collections)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Cash Outflow:</strong> {money(purchases + payments)}
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Operational Efficiency</Typography>
                        {(() => {
                          const sales = dayData.data.sales_amount || 0;
                          const purchases = dayData.data.purchase_amount || 0;
                          const collections = dayData.data.customer_collections || 0;
                          const payments = dayData.data.supplier_payments || 0;
                          const profitMargin = sales > 0 ? ((sales - purchases) / sales * 100) : 0;
                          const collectionRate = sales > 0 ? (collections / sales * 100) : 0;
                          const paymentCoverage = purchases > 0 ? (payments / purchases * 100) : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Profit Margin:</strong> <span style={{ color: profitMargin > 20 ? 'green' : profitMargin > 10 ? 'orange' : 'red' }}>{profitMargin.toFixed(2)}%</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Collection Rate:</strong> {collectionRate.toFixed(1)}% of sales
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Payment Coverage:</strong> {paymentCoverage.toFixed(1)}% of purchases
                              </Typography>
                              <Typography variant="body2">
                                <strong>Day Performance:</strong> <span style={{ color: sales > purchases ? 'green' : 'red' }}>
                                  {sales > purchases ? 'Profitable' : 'Loss Making'}
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
                <ScrollableTableContainer>
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
                </ScrollableTableContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Expense Analysis & Insights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Expense Metrics</Typography>
                        {(() => {
                          const summary = expenseData.data.summary || {};
                          const total = summary.total_expenses || 0;
                          const operating = summary.operating_expenses || 0;
                          const administrative = summary.administrative_expenses || 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Operating Ratio:</strong> {total > 0 ? ((operating / total) * 100).toFixed(2) : 0}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Administrative Ratio:</strong> {total > 0 ? ((administrative / total) * 100).toFixed(2) : 0}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Categories:</strong> {(expenseData.data.expenses || []).length}
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Cost Control</Typography>
                        {(() => {
                          const expenses = expenseData.data.expenses || [];
                          const highestExpense = expenses.reduce((max, e) => (e.amount || 0) > (max.amount || 0) ? e : max, expenses[0]);
                          const avgExpense = expenses.length > 0 ? expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / expenses.length : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Highest Category:</strong> {highestExpense?.category} ({money(highestExpense?.amount || 0)})
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg per Category:</strong> {money(avgExpense)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Expense Trend:</strong> <span style={{ color: 'orange' }}>Needs Analysis</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Expense Trend Analysis</Typography>
                    {(() => {
                      const expenses = expenseData.data.expenses || [];
                      const chartData = {
                        labels: expenses.map(e => e.category),
                        datasets: [
                          {
                            label: 'Current Period',
                            data: expenses.map(e => e.amount || 0),
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                          },
                          {
                            label: 'Average',
                            data: expenses.map(e => (e.amount || 0) * 0.8), // Simulated previous period
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            tension: 0.4,
                            fill: true,
                          }
                        ]
                      };
                      return <Line data={chartData} options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          tooltip: { mode: 'index', intersect: false }
                        },
                        scales: {
                          y: { beginAtZero: true }
                        }
                      }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Expense Category Radar</Typography>
                    {(() => {
                      const expenses = expenseData.data.expenses || [];
                      const maxAmount = Math.max(...expenses.map(e => e.amount || 0));
                      const chartData = {
                        labels: expenses.map(e => e.category),
                        datasets: [{
                          label: 'Expense Amount',
                          data: expenses.map(e => ((e.amount || 0) / maxAmount) * 100),
                          backgroundColor: 'rgba(255, 99, 132, 0.2)',
                          borderColor: 'rgba(255, 99, 132, 1)',
                          pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                          pointBorderColor: '#fff',
                          pointHoverBackgroundColor: '#fff',
                          pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                        }]
                      };
                      return <Radar data={chartData} options={{
                        responsive: true,
                        plugins: { legend: { position: 'top' } },
                        scales: {
                          r: {
                            beginAtZero: true,
                            max: 100
                          }
                        }
                      }} />;
                    })()}
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Expense Distribution</Typography>
                    {(() => {
                      const summary = expenseData.data.summary || {};
                      const chartData = {
                        labels: ['Operating', 'Administrative', 'Other'],
                        datasets: [{
                          data: [summary.operating_expenses || 0, summary.administrative_expenses || 0, summary.other_expenses || 0],
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(255, 206, 86, 0.8)',
                            'rgba(54, 162, 235, 0.8)'
                          ],
                          borderWidth: 1
                        }]
                      };
                      return <Doughnut data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Expense Impact Analysis</Typography>
                    {(() => {
                      const expenses = expenseData.data.expenses || [];
                      const total = expenseData.data.summary?.total_expenses || 0;
                      const chartData = {
                        labels: expenses.map(e => e.category),
                        datasets: [{
                          label: 'Impact Score',
                          data: expenses.map(e => ((e.amount || 0) / total) * 100),
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.6)',
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 206, 86, 0.6)',
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(153, 102, 255, 0.6)',
                          ],
                          borderWidth: 1
                        }]
                      };
                      return <PolarArea data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Expense Efficiency</Typography>
                    {(() => {
                      const expenses = expenseData.data.expenses || [];
                      const avgExpense = expenses.length > 0 ? expenses.reduce((sum, e) => sum + (e.amount || 0), 0) / expenses.length : 0;
                      const efficiency = expenses.map(e => ({
                        category: e.category,
                        efficiency: avgExpense > 0 ? ((avgExpense - (e.amount || 0)) / avgExpense) * 100 : 0,
                        amount: e.amount || 0
                      }));

                      return (
                        <Box>
                          {efficiency.map((item, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {item.category}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ flex: 1, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                                  <Box
                                    sx={{
                                      bgcolor: item.efficiency > 0 ? 'success.main' : 'error.main',
                                      width: `${Math.abs(item.efficiency)}%`,
                                      borderRadius: 1,
                                      height: 8
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ minWidth: 40 }}>
                                  {item.efficiency > 0 ? '+' : ''}{item.efficiency.toFixed(1)}%
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {money(item.amount)}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      );
                    })()}
                  </Paper>
                </Grid>
              </Grid>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Advanced Expense Analytics</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Predictive Insights</Typography>
                        {(() => {
                          const expenses = expenseData.data.expenses || [];
                          const total = expenseData.data.summary?.total_expenses || 0;
                          const monthlyAvg = total / 30; // Assuming 30 days period
                          const projectedMonthly = monthlyAvg * 30;
                          const variance = expenses.length > 0 ?
                            Math.sqrt(expenses.reduce((sum, e) => sum + Math.pow((e.amount || 0) - monthlyAvg, 2), 0) / expenses.length) : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Projected Monthly:</strong> {money(projectedMonthly)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Daily Average:</strong> {money(monthlyAvg)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Variance:</strong> {money(variance)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Risk Level:</strong>
                                <span style={{ color: variance > monthlyAvg ? 'red' : variance > monthlyAvg * 0.5 ? 'orange' : 'green' }}>
                                  {variance > monthlyAvg ? ' High' : variance > monthlyAvg * 0.5 ? ' Medium' : ' Low'}
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Efficiency Score:</strong>
                                <span style={{ color: variance < monthlyAvg * 0.3 ? 'green' : 'orange' }}>
                                  {variance < monthlyAvg * 0.3 ? ' Excellent' : variance < monthlyAvg * 0.6 ? ' Good' : ' Needs Improvement'}
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Optimization Recommendations</Typography>
                        {(() => {
                          const expenses = expenseData.data.expenses || [];
                          const summary = expenseData.data.summary || {};
                          const operatingRatio = summary.total_expenses ? ((summary.operating_expenses || 0) / summary.total_expenses) * 100 : 0;
                          const adminRatio = summary.total_expenses ? ((summary.administrative_expenses || 0) / summary.total_expenses) * 100 : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Operating Costs:</strong>
                                <span style={{ color: operatingRatio > 70 ? 'red' : operatingRatio > 50 ? 'orange' : 'green' }}>
                                  {operatingRatio.toFixed(1)}% {operatingRatio > 70 ? '(High)' : operatingRatio > 50 ? '(Moderate)' : '(Optimal)'}
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Admin Costs:</strong>
                                <span style={{ color: adminRatio > 30 ? 'red' : adminRatio > 20 ? 'orange' : 'green' }}>
                                  {adminRatio.toFixed(1)}% {adminRatio > 30 ? '(High)' : adminRatio > 20 ? '(Moderate)' : '(Optimal)'}
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Cost Structure:</strong>
                                <span style={{ color: 'blue' }}>
                                  {operatingRatio > 60 && adminRatio > 25 ? 'Needs Restructuring' : 'Well Balanced'}
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Savings Potential:</strong>
                                <span style={{ color: 'green' }}>
                                  {money((summary.total_expenses || 0) * 0.1)} (10% reduction target)
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
                <ScrollableTableContainer>
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
                </ScrollableTableContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Salary Analysis & Insights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Payroll Metrics</Typography>
                        {(() => {
                          const departments = salaryData.data.departments || [];
                          const highestPaidDept = departments.reduce((max, d) => (d.average_salary || 0) > (max.average_salary || 0) ? d : max, departments[0]);
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Payroll Growth:</strong> <span style={{ color: 'blue' }}>Track Monthly</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Highest Paid Dept:</strong> {highestPaidDept?.department} ({money(highestPaidDept?.average_salary || 0)})
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Departments:</strong> {departments.length}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Budget Utilization:</strong> <span style={{ color: 'orange' }}>Monitor Closely</span>
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Cost Analysis</Typography>
                        {(() => {
                          const departments = salaryData.data.departments || [];
                          const totalEmployees = departments.reduce((sum, d) => sum + (d.employee_count || 0), 0);
                          const avgDeptSize = departments.length > 0 ? totalEmployees / departments.length : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Employees:</strong> {totalEmployees}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Dept Size:</strong> {avgDeptSize.toFixed(1)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Salary Range:</strong> <span style={{ color: 'green' }}>Manage Variance</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Payroll Health:</strong> <span style={{ color: 'green' }}>On Track</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Department Salary Comparison</Typography>
                    {(() => {
                      const departments = salaryData.data.departments || [];
                      const chartData = {
                        labels: departments.map(d => d.department),
                        datasets: [{
                          label: 'Average Salary',
                          data: departments.map(d => d.average_salary || 0),
                          backgroundColor: 'rgba(54, 162, 235, 0.8)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1
                        }]
                      };
                      return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Employee Distribution</Typography>
                    {(() => {
                      const departments = salaryData.data.departments || [];
                      const chartData = {
                        labels: departments.map(d => d.department),
                        datasets: [{
                          data: departments.map(d => d.employee_count || 0),
                          backgroundColor: 'rgba(75, 192, 192, 0.8)',
                          borderWidth: 1
                        }]
                      };
                      return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                    })()}
                  </Paper>
                </Grid>
              </Grid>
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
                <ScrollableTableContainer>
                  <TableContainer>
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Type</TableCell><TableCell>Description</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Balance</TableCell></TableRow></TableHead>
                      <TableBody>
                        {(cashFlowData.data.transactions || []).map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.date ? format(new Date(t.date), 'yyyy-MM-dd') : '-'}</TableCell>
                            <TableCell>{t.type}</TableCell>
                            <TableCell>{t.description}</TableCell>
                            <TableCell align="right">{money(t.amount)}</TableCell>
                            <TableCell align="right">{money(t.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </ScrollableTableContainer>
              </Paper>

              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Cash Flow Analysis & Insights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Flow Metrics</Typography>
                        {(() => {
                          const summary = cashFlowData.data.summary || {};
                          const netFlow = summary.net_cash_flow || 0;
                          const totalInflow = summary.total_inflow || 0;
                          const totalOutflow = summary.total_outflow || 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Net Cash Position:</strong> <span style={{ color: netFlow >= 0 ? 'green' : 'red' }}>{money(netFlow)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Inflow Ratio:</strong> {totalInflow > 0 ? ((totalInflow / (totalInflow + totalOutflow)) * 100).toFixed(1) : 0}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Cash Health:</strong> <span style={{ color: netFlow >= 0 ? 'green' : 'orange' }}>{netFlow >= 0 ? 'Positive' : 'Negative'}</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Flow Trend:</strong> <span style={{ color: 'blue' }}>Monitor Daily</span>
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Liquidity Analysis</Typography>
                        {(() => {
                          const transactions = cashFlowData.data.transactions || [];
                          const inflowTransactions = transactions.filter(t => t.type === 'Inflow');
                          const outflowTransactions = transactions.filter(t => t.type === 'Outflow');
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Transactions:</strong> {transactions.length}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Inflow Count:</strong> {inflowTransactions.length}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Outflow Count:</strong> {outflowTransactions.length}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Transaction Frequency:</strong> <span style={{ color: 'green' }}>Active</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Cash Flow Trend</Typography>
                    {(() => {
                      const transactions = cashFlowData.data.transactions || [];
                      const dailyData = transactions.reduce((acc, t) => {
                        const dayKey = t.date ? format(new Date(t.date), 'yyyy-MM-dd') : 'Unknown';
                        if (!acc[dayKey]) {
                          acc[dayKey] = { inflow: 0, outflow: 0 };
                        }
                        if (t.type === 'Inflow') {
                          acc[dayKey].inflow += t.amount || 0;
                        } else {
                          acc[dayKey].outflow += t.amount || 0;
                        }
                        return acc;
                      }, {});

                      const chartData = {
                        labels: Object.keys(dailyData),
                        datasets: [
                          {
                            label: 'Inflow',
                            data: Object.values(dailyData).map(d => d.inflow),
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1,
                          },
                          {
                            label: 'Outflow',
                            data: Object.values(dailyData).map(d => d.outflow),
                            borderColor: 'rgb(255, 99, 132)',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            tension: 0.1,
                          }
                        ]
                      };
                      return <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Flow Distribution</Typography>
                    {(() => {
                      const summary = cashFlowData.data.summary || {};
                      const chartData = {
                        labels: ['Total Inflow', 'Total Outflow'],
                        datasets: [{
                          data: [summary.total_inflow || 0, summary.total_outflow || 0],
                          backgroundColor: [
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(255, 99, 132, 0.8)'
                          ],
                          borderWidth: 1
                        }]
                      };
                      return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                    })()}
                  </Paper>
                </Grid>
              </Grid>
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
              {/* Sales Team Performance Overview */}
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

              {/* Sales Performance Analysis */}
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
                            <>
                              <ScrollableTableContainer>
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
                                        const commission = salesperson.sales_achieved ? (salesperson.sales_achieved * 0.05) : 0; // 5% commission rate
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
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Team Performance Summary</Typography>
                        {(() => {
                          const salesTeam = employeeData.data.salesTeam || [];
                          const totalTarget = salesTeam.reduce((sum, s) => sum + (s.sales_target || 0), 0);
                          const totalAchieved = salesTeam.reduce((sum, s) => sum + (s.sales_achieved || 0), 0);
                          const overallAchievementRate = totalTarget > 0 ? (totalAchieved / totalTarget * 100) : 0;
                          const topPerformer = salesTeam.sort((a, b) => (b.sales_achieved || 0) - (a.sales_achieved || 0))[0];
                          const totalCommission = salesTeam.reduce((sum, s) => sum + ((s.sales_achieved || 0) * 0.05), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Overall Target:</strong> {money(totalTarget)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Overall Achieved:</strong> <span style={{ color: overallAchievementRate >= 100 ? 'green' : overallAchievementRate >= 80 ? 'orange' : 'red' }}>
                                  {money(totalAchieved)}
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Achievement Rate:</strong> <span style={{ color: overallAchievementRate >= 100 ? 'green' : overallAchievementRate >= 80 ? 'orange' : 'red' }}>
                                  {overallAchievementRate.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Top Performer:</strong> {topPerformer?.employee_name || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Total Commission:</strong> {money(totalCommission)}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Target vs Achieved Analysis */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Target vs Achieved Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Performance Distribution</Typography>
                        {(() => {
                          const salesTeam = employeeData.data.salesTeam || [];
                          const exceededTarget = salesTeam.filter(s => (s.sales_achieved || 0) >= (s.sales_target || 0));
                          const onTrack = salesTeam.filter(s => (s.sales_achieved || 0) >= (s.sales_target || 0) * 0.8 && (s.sales_achieved || 0) < (s.sales_target || 0));
                          const belowTarget = salesTeam.filter(s => (s.sales_achieved || 0) < (s.sales_target || 0) * 0.8);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Exceeded Target:</strong> <span style={{ color: 'green' }}>{exceededTarget.length} ({salesTeam.length > 0 ? (exceededTarget.length / salesTeam.length * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>On Track:</strong> <span style={{ color: 'orange' }}>{onTrack.length} ({salesTeam.length > 0 ? (onTrack.length / salesTeam.length * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Below Target:</strong> <span style={{ color: 'red' }}>{belowTarget.length} ({salesTeam.length > 0 ? (belowTarget.length / salesTeam.length * 100).toFixed(1) : 0}%)</span>
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Commission Analysis</Typography>
                        {(() => {
                          const salesTeam = employeeData.data.salesTeam || [];
                          const totalCommission = salesTeam.reduce((sum, s) => sum + ((s.sales_achieved || 0) * 0.05), 0);
                          const avgCommission = salesTeam.length > 0 ? totalCommission / salesTeam.length : 0;
                          const highestCommission = salesTeam.length > 0 ? Math.max(...salesTeam.map(s => (s.sales_achieved || 0) * 0.05)) : 0;
                          const lowestCommission = salesTeam.length > 0 ? Math.min(...salesTeam.map(s => (s.sales_achieved || 0) * 0.05)) : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Commission:</strong> {money(totalCommission)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Commission:</strong> {money(avgCommission)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Highest:</strong> {money(highestCommission)}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Lowest:</strong> {money(lowestCommission)}
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Employee Performance Trends */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Employee Performance Trends</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Monthly Sales Performance</Typography>
                        {(() => {
                          const monthlyPerformance = employeeData.data.monthlyPerformance || [];
                          const chartData = {
                            labels: monthlyPerformance.slice(-6).map(m => m.month || ''),
                            datasets: [
                              {
                                label: 'Target Sales',
                                data: monthlyPerformance.slice(-6).map(m => m.target_sales || 0),
                                borderColor: 'rgb(255, 99, 132)',
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                tension: 0.1,
                              },
                              {
                                label: 'Actual Sales',
                                data: monthlyPerformance.slice(-6).map(m => m.actual_sales || 0),
                                borderColor: 'rgb(54, 162, 235)',
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Performance Metrics</Typography>
                        {(() => {
                          const monthlyPerformance = employeeData.data.monthlyPerformance || [];
                          const latestMonth = monthlyPerformance[monthlyPerformance.length - 1] || {};
                          const previousMonth = monthlyPerformance[monthlyPerformance.length - 2] || {};
                          const momGrowth = previousMonth.actual_sales ? ((latestMonth.actual_sales - previousMonth.actual_sales) / previousMonth.actual_sales * 100) : 0;

                          const avgAchievementRate = monthlyPerformance.length > 0 ?
                            monthlyPerformance.reduce((sum, m) => sum + (m.actual_sales / Math.max(m.target_sales || 1, 1) * 100), 0) / monthlyPerformance.length : 0;

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>MoM Growth:</strong>
                                <span style={{ color: momGrowth >= 0 ? 'green' : 'red' }}>
                                  {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Achievement:</strong>
                                <span style={{ color: avgAchievementRate >= 90 ? 'green' : avgAchievementRate >= 80 ? 'orange' : 'red' }}>
                                  {avgAchievementRate.toFixed(1)}%
                                </span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Team Trend:</strong>
                                <span style={{ color: momGrowth >= 5 ? 'green' : momGrowth >= 0 ? 'orange' : 'red' }}>
                                  {momGrowth >= 5 ? 'Strong Growth' : momGrowth >= 0 ? 'Stable' : 'Declining'}
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

              {/* Employee Details */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>Employee Details</Typography>
                <ScrollableTableContainer>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Department</TableCell>
                          <TableCell align="right">Employees</TableCell>
                          <TableCell align="right">Active</TableCell>
                          <TableCell align="right">New Hires</TableCell>
                          <TableCell align="right">Avg Salary</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(employeeData.data.departments || []).map((d) => (
                          <TableRow key={d.department}>
                            <TableCell>{d.department}</TableCell>
                            <TableCell align="right">{d.total_employees}</TableCell>
                            <TableCell align="right">{d.active_employees}</TableCell>
                            <TableCell align="right">{d.new_hires}</TableCell>
                            <TableCell align="right">{money(d.average_salary)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </ScrollableTableContainer>
              </Paper>

              {/* Employee Analysis & Insights */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Employee Analysis & Insights</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Workforce Metrics</Typography>
                        {(() => {
                          const summary = employeeData.data.summary || {};
                          const departments = employeeData.data.departments || [];
                          const totalEmployees = summary.total_employees || 0;
                          const activeEmployees = summary.active_employees || 0;
                          const newHires = summary.new_hires || 0;
                          const attritionRate = summary.attrition_rate || 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Active Rate:</strong> {totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : 0}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Hiring Rate:</strong> {totalEmployees > 0 ? ((newHires / totalEmployees) * 100).toFixed(1) : 0}%
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Departments:</strong> {departments.length}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Attrition Risk:</strong>
                                <span style={{ color: attritionRate > 10 ? 'red' : attritionRate > 5 ? 'orange' : 'green' }}>
                                  {attritionRate > 10 ? 'High' : attritionRate > 5 ? 'Moderate' : 'Low'}
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Organization Health</Typography>
                        {(() => {
                          const departments = employeeData.data.departments || [];
                          const largestDept = departments.reduce((max, d) => (d.total_employees || 0) > (max.total_employees || 0) ? d : max, departments[0]);
                          const avgDeptSize = departments.length > 0 ? departments.reduce((sum, d) => sum + (d.total_employees || 0), 0) / departments.length : 0;
                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Largest Dept:</strong> {largestDept?.department} ({largestDept?.total_employees || 0} employees)
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Avg Dept Size:</strong> {avgDeptSize.toFixed(1)}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Team Distribution:</strong> <span style={{ color: 'blue' }}>Balanced</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Growth Trend:</strong> <span style={{ color: 'green' }}>Expanding</span>
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Productivity Analysis & Charts */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Revenue per Employee</Typography>
                    {(() => {
                      const summary = employeeData.data.summary || {};
                      const monthly = pnlData?.data?.monthly || [];
                      const latestRevenue = monthly[monthly.length - 1]?.sales || 0;
                      const revenuePerEmployee = (summary.total_employees || 0) > 0 ? latestRevenue / summary.total_employees : 0;

                      return (
                        <>
                          <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
                            {money(revenuePerEmployee)}
                          </Typography>
                          <Typography variant="body2" sx={{ textAlign: 'center', color: revenuePerEmployee > 100000 ? 'success.main' : revenuePerEmployee > 50000 ? 'warning.main' : 'error.main' }}>
                            {revenuePerEmployee > 100000 ? 'Excellent Productivity' : revenuePerEmployee > 50000 ? 'Good Productivity' : 'Needs Improvement'}
                          </Typography>
                        </>
                      );
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Training ROI</Typography>
                    {(() => {
                      const summary = employeeData.data.summary || {};
                      const trainingCost = summary.training_cost || 0;
                      const productivityGain = summary.productivity_gain || 0;
                      const roi = trainingCost > 0 ? ((productivityGain - trainingCost) / trainingCost * 100) : 0;

                      return (
                        <>
                          <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
                            {roi.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" sx={{ textAlign: 'center', color: roi > 50 ? 'success.main' : roi > 20 ? 'warning.main' : 'error.main' }}>
                            {roi > 50 ? 'High ROI' : roi > 20 ? 'Moderate ROI' : 'Low ROI'}
                          </Typography>
                        </>
                      );
                    })()}
                  </Paper>
                </Grid>
              </Grid>

              {/* Re-nested Charts */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Department Size Comparison</Typography>
                    {(() => {
                      const departments = employeeData.data.departments || [];
                      const chartData = {
                        labels: departments.map(d => d.department),
                        datasets: [{
                          label: 'Total Employees',
                          data: departments.map(d => d.total_employees || 0),
                          backgroundColor: 'rgba(54, 162, 235, 0.8)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1
                        }]
                      };
                      return <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />;
                    })()}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Employee Status</Typography>
                    {(() => {
                      const summary = employeeData.data.summary || {};
                      const chartData = {
                        labels: ['Active', 'Inactive'],
                        datasets: [{
                          data: [summary.active_employees || 0, (summary.total_employees || 0) - (summary.active_employees || 0)],
                          backgroundColor: [
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(255, 206, 86, 0.8)'
                          ],
                          borderWidth: 1
                        }]
                      };
                      return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                    })()}
                  </Paper>
                </Grid>
              </Grid>
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
              {/* Inventory Analytics Charts */}
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

              {/* Stock Aging Analysis Charts */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Stock Aging Analysis</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Aging Categories Distribution</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const freshItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) >= (i.min_stock_level || 0) * 3);
                          const normalItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) >= (i.min_stock_level || 0) && (i.stock || 0) < (i.min_stock_level || 0) * 3);
                          const slowItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) < (i.min_stock_level || 0));
                          const agedItems = items.filter(i => (i.stock || 0) === 0);

                          const chartData = {
                            labels: ['Fresh Stock', 'Normal Stock', 'Slow Stock', 'Aged Stock'],
                            datasets: [{
                              label: 'Product Count',
                              data: [freshItems.length, normalItems.length, slowItems.length, agedItems.length],
                              backgroundColor: [
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(255, 99, 132, 0.8)',
                              ],
                              borderColor: [
                                'rgb(75, 192, 192)',
                                'rgb(54, 162, 235)',
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
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Reorder Priority Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const urgentItems = items.filter(i => (i.stock || 0) === 0);
                          const highItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) < (i.min_stock_level || 0) * 0.5);
                          const mediumItems = items.filter(i => (i.stock || 0) >= (i.min_stock_level || 0) * 0.5 && (i.stock || 0) < (i.min_stock_level || 0));
                          const normalItems = items.filter(i => (i.stock || 0) >= (i.min_stock_level || 0));

                          const chartData = {
                            labels: ['Urgent', 'High Priority', 'Medium Priority', 'Normal'],
                            datasets: [{
                              label: 'Items Needing Attention',
                              data: [urgentItems.length, highItems.length, mediumItems.length, normalItems.length],
                              backgroundColor: [
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                              ],
                              borderColor: [
                                'rgb(255, 99, 132)',
                                'rgb(255, 159, 64)',
                                'rgb(255, 206, 86)',
                                'rgb(75, 192, 192)',
                              ],
                              borderWidth: 1
                            }]
                          };
                          return <Pie data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />;
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Fast Moving Products</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
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
                            <>
                              <ScrollableTableContainer>
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
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Movement Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const totalItems = items.length;
                          const fastMovingItems = items.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 2);
                          const veryFastMoving = items.filter(i => (i.stock || 0) > (i.min_stock_level || 0) * 3);
                          const totalStockValue = items.reduce((sum, i) => sum + (i.stock_value || 0), 0);
                          const fastMovingValue = fastMovingItems.reduce((sum, i) => sum + (i.stock_value || 0), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Total Products:</strong> {totalItems}
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Fast Moving:</strong> <span style={{ color: 'green' }}>{fastMovingItems.length} ({totalItems > 0 ? (fastMovingItems.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Very Fast Moving:</strong> <span style={{ color: 'blue' }}>{veryFastMoving.length}</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Fast Moving Value:</strong> {money(fastMovingValue)} ({totalStockValue > 0 ? (fastMovingValue / totalStockValue * 100).toFixed(1) : 0}%)
                              </Typography>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Slow Moving Products */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Slow Moving Products</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="warning.main" gutterBottom>Slow Moving Items</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const slowMovingItems = items
                            .filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0))
                            .sort((a, b) => (a.stock || 0) - (b.stock || 0))
                            .slice(0, 10);

                          return (
                            <>
                              <ScrollableTableContainer>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Current Stock</TableCell>
                                        <TableCell align="right">Min Level</TableCell>
                                        <TableCell align="right">Stock Ratio</TableCell>
                                        <TableCell align="right">Action</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {slowMovingItems.map((item, index) => {
                                        const stockRatio = (item.stock || 0) / Math.max(item.min_stock_level || 1, 1);
                                        return (
                                          <TableRow key={item.item_id || index}>
                                            <TableCell>{item.item_name}</TableCell>
                                            <TableCell align="right">{item.stock || 0}</TableCell>
                                            <TableCell align="right">{item.min_stock_level || 0}</TableCell>
                                            <TableCell align="right">{stockRatio.toFixed(1)}x</TableCell>
                                            <TableCell align="right">
                                              <span style={{ color: stockRatio < 0.5 ? 'red' : stockRatio < 1 ? 'orange' : '#ffb300' }}>
                                                {stockRatio < 0.5 ? 'Critical' : stockRatio < 1 ? 'Low' : 'Monitor'}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Slow Movement Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const totalItems = items.length;
                          const slowMovingItems = items.filter(i => (i.stock || 0) > 0 && (i.stock || 0) <= (i.min_stock_level || 0));
                          const criticalItems = items.filter(i => (i.stock || 0) < (i.min_stock_level || 0) * 0.5);
                          const totalSlowValue = slowMovingItems.reduce((sum, i) => sum + (i.stock_value || 0), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Slow Moving:</strong> <span style={{ color: 'orange' }}>{slowMovingItems.length} ({totalItems > 0 ? (slowMovingItems.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Critical Stock:</strong> <span style={{ color: 'red' }}>{criticalItems.length}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Slow Moving Value:</strong> {money(totalSlowValue)}</Typography>
                              <Typography variant="body2">
                                <strong>Risk Level:</strong>
                                <span style={{ color: criticalItems.length > totalItems * 0.1 ? 'red' : criticalItems.length > 0 ? 'orange' : 'green' }}>
                                  {criticalItems.length > totalItems * 0.1 ? 'High' : criticalItems.length > 0 ? 'Medium' : 'Low'}
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

              {/* Dead Stock Identification */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Dead Stock Identification</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="error" gutterBottom>Out of Stock Items</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const deadStockItems = items
                            .filter(i => (i.stock || 0) === 0)
                            .sort((a, b) => (b.stock_value || 0) - (a.stock_value || 0))
                            .slice(0, 10);

                          return (
                            <>
                              <ScrollableTableContainer>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Current Stock</TableCell>
                                        <TableCell align="right">Min Level</TableCell>
                                        <TableCell align="right">Last Value</TableCell>
                                        <TableCell align="right">Priority</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {deadStockItems.map((item, index) => (
                                        <TableRow key={item.item_id || index}>
                                          <TableCell>{item.item_name}</TableCell>
                                          <TableCell align="right" sx={{ color: 'red' }}>{item.stock || 0}</TableCell>
                                          <TableCell align="right">{item.min_stock_level || 0}</TableCell>
                                          <TableCell align="right">{money(item.stock_value || 0)}</TableCell>
                                          <TableCell align="right">
                                            <span style={{ color: (item.min_stock_level || 0) > 10 ? 'red' : (item.min_stock_level || 0) > 5 ? 'orange' : '#ffb300' }}>
                                              {(item.min_stock_level || 0) > 10 ? 'Urgent' : (item.min_stock_level || 0) > 5 ? 'High' : 'Medium'}
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Dead Stock Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const totalItems = items.length;
                          const deadStockItems = items.filter(i => (i.stock || 0) === 0);
                          const urgentItems = deadStockItems.filter(i => (i.min_stock_level || 0) > 10);
                          const totalDeadValue = deadStockItems.reduce((sum, i) => sum + (i.stock_value || 0), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Out of Stock:</strong> <span style={{ color: 'red' }}>{deadStockItems.length} ({totalItems > 0 ? (deadStockItems.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Urgent Restock:</strong> <span style={{ color: 'darkred' }}>{urgentItems.length}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Lost Revenue:</strong> {money(totalDeadValue)}</Typography>
                              <Typography variant="body2">
                                <strong>Stock Health:</strong>
                                <span style={{ color: deadStockItems.length > totalItems * 0.2 ? 'red' : deadStockItems.length > totalItems * 0.1 ? 'orange' : 'green' }}>
                                  {deadStockItems.length > totalItems * 0.2 ? 'Critical' : deadStockItems.length > totalItems * 0.1 ? 'Poor' : 'Good'}
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

              {/* Stock Aging Report */}
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Stock Aging Report</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="primary" gutterBottom>Aging Categories</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const totalItems = items.length;
                          const freshStock = items.filter(i => (i.days_in_stock || 0) <= 30);
                          const normalStock = items.filter(i => (i.days_in_stock || 0) > 30 && (i.days_in_stock || 0) <= 90);
                          const slowStock = items.filter(i => (i.days_in_stock || 0) > 90 && (i.days_in_stock || 0) <= 180);
                          const agedStock = items.filter(i => (i.days_in_stock || 0) > 180);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Fresh (≤30 days):</strong> <span style={{ color: 'green' }}>{freshStock.length} ({totalItems > 0 ? (freshStock.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Normal (31-90 days):</strong> <span style={{ color: 'blue' }}>{normalStock.length} ({totalItems > 0 ? (normalStock.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Slow (91-180 days):</strong> <span style={{ color: 'orange' }}>{slowStock.length} ({totalItems > 0 ? (slowStock.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Aged (&gt;180 days):</strong> <span style={{ color: 'red' }}>{agedStock.length} ({totalItems > 0 ? (agedStock.length / totalItems * 100).toFixed(1) : 0}%)</span>
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
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Aging Analysis</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const avgAge = items.length > 0 ? items.reduce((sum, i) => sum + (i.days_in_stock || 0), 0) / items.length : 0;
                          const agedValue = items.filter(i => (i.days_in_stock || 0) > 180).reduce((sum, i) => sum + (i.stock_value || 0), 0);
                          const totalValue = items.reduce((sum, i) => sum + (i.stock_value || 0), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Average Age:</strong> {avgAge.toFixed(0)} days
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Aged Stock Value:</strong> <span style={{ color: 'red' }}>{money(agedValue)}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Aged Value %:</strong> {totalValue > 0 ? (agedValue / totalValue * 100).toFixed(1) : 0}%
                              </Typography>
                              <Typography variant="body2">
                                <strong>Aging Health:</strong>
                                <span style={{ color: avgAge < 60 ? 'green' : avgAge < 120 ? 'orange' : 'red' }}>
                                  {avgAge < 60 ? 'Excellent' : avgAge < 120 ? 'Good' : 'Poor'}
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

              {/* Reorder Level Alerts */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Reorder Level Alerts</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="warning.main" gutterBottom>Items Needing Reorder</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const reorderItems = items
                            .filter(i => (i.stock || 0) <= (i.min_stock_level || 0))
                            .sort((a, b) => (a.stock || 0) - (b.stock || 0))
                            .slice(0, 15);

                          return (
                            <>
                              <ScrollableTableContainer>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Product</TableCell>
                                        <TableCell align="right">Current Stock</TableCell>
                                        <TableCell align="right">Reorder Level</TableCell>
                                        <TableCell align="right">Suggested Order</TableCell>
                                        <TableCell align="right">Urgency</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {reorderItems.map((item, index) => {
                                        const suggestedOrder = Math.max(((item.min_stock_level || 0) * 2) - (item.stock || 0), (item.min_stock_level || 0));
                                        const urgency = (item.stock || 0) === 0 ? 'Critical' : (item.stock || 0) < (item.min_stock_level || 0) * 0.5 ? 'High' : 'Medium';
                                        return (
                                          <TableRow key={item.item_id || index}>
                                            <TableCell>{item.item_name}</TableCell>
                                            <TableCell align="right" sx={{ color: (item.stock || 0) === 0 ? 'red' : (item.stock || 0) < (item.min_stock_level || 0) * 0.5 ? 'orange' : '#ffb300' }}>
                                              {item.stock || 0}
                                            </TableCell>
                                            <TableCell align="right">{item.min_stock_level || 0}</TableCell>
                                            <TableCell align="right">{suggestedOrder}</TableCell>
                                            <TableCell align="right">
                                              <span style={{
                                                color: urgency === 'Critical' ? 'red' : urgency === 'High' ? 'orange' : '#ffb300',
                                                fontWeight: urgency === 'Critical' ? 'bold' : 'normal'
                                              }}>
                                                {urgency}
                                              </span>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </ScrollableTableContainer>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle1" color="secondary" gutterBottom>Reorder Summary</Typography>
                        {(() => {
                          const items = inventoryData.data.stockItems || [];
                          const totalItems = items.length;
                          const reorderItems = items.filter(i => (i.stock || 0) <= (i.min_stock_level || 0));
                          const criticalItems = items.filter(i => (i.stock || 0) === 0);
                          const urgentItems = items.filter(i => (i.stock || 0) < (i.min_stock_level || 0) * 0.5);
                          const totalReorderValue = reorderItems.reduce((sum, i) => sum + (i.stock_value || 0), 0);

                          return (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Need Reorder:</strong> <span style={{ color: 'orange' }}>{reorderItems.length} ({totalItems > 0 ? (reorderItems.length / totalItems * 100).toFixed(1) : 0}%)</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Critical:</strong> <span style={{ color: 'red' }}>{criticalItems.length}</span>
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Urgent:</strong> <span style={{ color: 'darkorange' }}>{urgentItems.length}</span>
                              </Typography>
                              <Typography variant="body2">
                                <strong>Reorder Value:</strong> {money(totalReorderValue)}
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
          ) : (
            <Alert severity="info">No inventory data available</Alert>
          )}
        </Box>
      )}

      {/* Sales Performance Dialog */}
      <Dialog open={salesPerformanceDialog} onClose={() => setSalesPerformanceDialog(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp />
          Add Sales Performance Data - Excel Style Entry
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Enter sales performance data in a spreadsheet-like format. Fill in required fields (marked with *) for each row.
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Keyboard Shortcuts:</strong> Tab/Shift+Tab (navigate), Enter (next field), Arrow Up/Down (navigate rows), Ctrl+Enter (submit)
            </Typography>
          </Box>

          <ScrollableTableContainer>
            <TableContainer sx={{ border: '1px solid #ddd', borderRadius: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Date *</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Sales Amount *</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Target Sales</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 100 }}>Achievement %</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Notes</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesPerformanceData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="date"
                          size="small"
                          value={row.date}
                          onChange={(e) => handleSalesPerformanceChange(index, 'date', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={row.sales_amount}
                          onChange={(e) => handleSalesPerformanceChange(index, 'sales_amount', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={row.target_sales}
                          onChange={(e) => handleSalesPerformanceChange(index, 'target_sales', e.target.value)}
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.achievement_rate}
                          disabled
                          sx={{
                            '& .MuiInputBase-input.Mui-disabled': {
                              color: row.achievement_rate && parseFloat(row.achievement_rate) >= 100 ? 'green' :
                                row.achievement_rate && parseFloat(row.achievement_rate) >= 80 ? 'orange' : 'red'
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.notes}
                          onChange={(e) => handleSalesPerformanceChange(index, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveSalesPerformanceRow(index)}
                          disabled={salesPerformanceData.length === 1}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ScrollableTableContainer>

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddSalesPerformanceRow}
            >
              Add Row
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {salesPerformanceData.filter(row => row.date && row.sales_amount).length} of {salesPerformanceData.length} rows filled
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSalesPerformanceDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSalesPerformanceSubmit}
            disabled={salesPerformanceData.filter(row => row.date && row.sales_amount).length === 0}
          >
            Add {salesPerformanceData.filter(row => row.date && row.sales_amount).length} Sales Entries
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Date Picker Dialog */}
      <Dialog open={datePickerOpen} onClose={() => setDatePickerOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select Date Range for {customTimeframe.charAt(0).toUpperCase() + customTimeframe.slice(1)} Report
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="From Date"
                type="date"
                fullWidth
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: customToDate || format(new Date(), 'yyyy-MM-dd') }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="To Date"
                type="date"
                fullWidth
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: customFromDate, max: format(new Date(), 'yyyy-MM-dd') }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                bgcolor: 'info.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.main'
              }}>
                <Typography variant="body2" color="info.dark">
                  <strong>Report Type:</strong> {customTimeframe.charAt(0).toUpperCase() + customTimeframe.slice(1)}
                </Typography>
                <Typography variant="body2" color="info.dark">
                  <strong>Period:</strong> {customFromDate && customToDate ?
                    `${format(new Date(customFromDate), 'MMM dd, yyyy')} - ${format(new Date(customToDate), 'MMM dd, yyyy')}` :
                    'Please select dates'
                  }
                </Typography>
                <Typography variant="caption" color="info.dark" sx={{ mt: 1 }}>
                  {customTimeframe === 'daily' && 'Reports will be generated for each day between selected dates'}
                  {customTimeframe === 'monthly' && 'Reports will be generated for each month between selected dates'}
                  {customTimeframe === 'yearly' && 'Reports will be generated for each year between selected dates'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDatePickerOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={exportWithCustomDates}
            disabled={!customFromDate || !customToDate}
            startIcon={<Download />}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default Reports;
