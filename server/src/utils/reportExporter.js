const { jsPDF } = require('jspdf');
const autoTableModule = require('jspdf-autotable');
const autoTable = autoTableModule.default || autoTableModule.autoTable || autoTableModule;
const formatMoney = (value) => {
  const amount = Number(value || 0);
  return `INR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Main function to generate PDF report
 * @param {Object} data - The data to be included in the report
 * @param {string} reportType - The type of report (e.g., 'sales', 'inventory', 'expenses')
 * @param {string} title - The title of the report
 * @returns {jsPDF} - The generated jsPDF document instance
 */
const generatePDFReport = (data, reportType, title) => {
  const doc = new jsPDF();

  // Add title (Centered on A4)
  doc.setFontSize(16);
  doc.text(title, 105, 20, { align: 'center' });

  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  let yPosition = 50;

  switch (reportType) {
    case 'sales':
      return generateSalesPDF(doc, data, yPosition);
    case 'inventory':
      return generateInventoryPDF(doc, data, yPosition);
    case 'expenses':
      return generateExpensesPDF(doc, data, yPosition);
    case 'salary':
      return generateSalaryPDF(doc, data, yPosition);
    case 'cashflow':
      return generateCashFlowPDF(doc, data, yPosition);
    case 'employees':
      return generateEmployeesPDF(doc, data, yPosition);
    default:
      return generateGenericPDF(doc, data, yPosition);
  }
};

const generateSalesPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Sales Report Summary', 14, yPosition);
  yPosition += 10;

  // Summary table
  const summaryData = [
    ['Total Sales', formatMoney(data.summary?.total_sales)],
    ['Total Bills', String(data.summary?.total_bills || 0)],
    ['Total Discount', formatMoney(data.summary?.total_discount)],
    ['Total Tax', formatMoney(data.summary?.total_tax)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Daily breakdown
  doc.text('Daily Sales Breakdown', 14, yPosition);
  yPosition += 8;

  const dailyData = (data.dailyBreakdown || []).map(d => [
    d.bill_date,
    d.bills,
    formatMoney(d.sales),
    formatMoney(d.discount),
    formatMoney(d.tax)
  ]);

  if (dailyData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Bills', 'Sales', 'Discount', 'Tax']],
      body: dailyData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });
  }

  return doc;
};

const generateInventoryPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Inventory Report Summary', 14, yPosition);
  yPosition += 10;

  const summaryData = [
    ['Total Items', String(data.summary?.total_items || 0)],
    ['Total Stock', String(data.summary?.total_stock || 0)],
    ['Total Value', formatMoney(data.summary?.total_value)],
    ['Low Stock Count', String(data.summary?.low_stock_count || 0)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  doc.text('Stock Details', 14, yPosition);
  yPosition += 8;

  const stockData = (data.stockItems || []).map((item) => [
    item.item_code || item.item_id || '',
    item.item_name || '',
    item.stock || 0,
    item.min_stock_level || 0,
    formatMoney(item.purchase_price),
    formatMoney(item.sale_price),
    formatMoney(item.stock_value)
  ]);

  if (stockData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Code', 'Item', 'Stock', 'Min', 'Purchase', 'Sale', 'Value']],
      body: stockData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    yPosition = doc.lastAutoTable.finalY + 15;
  }

  if (Array.isArray(data.movement) && data.movement.length > 0) {
    doc.text('Movement Details', 14, yPosition);
    yPosition += 8;
    const movementData = data.movement.map((m) => [
      m.item_name || '',
      m.sold_qty || 0,
      formatMoney(m.sales_amount)
    ]);
    autoTable(doc, {
      startY: yPosition,
      head: [['Item', 'Sold Qty', 'Sales Amount']],
      body: movementData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
  }

  return doc;
};

const generateExpensesPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Expense Report Summary', 14, yPosition);
  yPosition += 10;

  // Summary table
  const summaryData = [
    ['Total Expenses', formatMoney(data.summary?.total_expenses)],
    ['Operating Expenses', formatMoney(data.summary?.operating_expenses)],
    ['Administrative Expenses', formatMoney(data.summary?.administrative_expenses)],
    ['Marketing Expenses', formatMoney(data.summary?.marketing_expenses)],
    ['Maintenance Expenses', formatMoney(data.summary?.maintenance_expenses)],
    ['Salary Expenses', formatMoney(data.summary?.salary_expenses)],
    ['Other Expenses', formatMoney(data.summary?.other_expenses)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Amount']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Expense details
  doc.text('Detailed Expenses', 14, yPosition);
  yPosition += 8;

  const detailedData = (data.detailed || []).map(exp => [
    exp.date ? new Date(exp.date).toLocaleDateString('en-GB') : '-',
    exp.category || '-',
    exp.description || '-',
    formatMoney(exp.amount),
    exp.payment_method || '-',
    exp.created_by || '-'
  ]);

  if (detailedData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Category', 'Description', 'Amount', 'Payment Method', 'Created By']],
      body: detailedData,
      theme: 'grid',
      tableWidth: 'auto',
      styles: { fontSize: 7, overflow: 'ellipsize', cellPadding: 1.5, valign: 'middle' }
    });
  } else {
    autoTable(doc, {
      startY: yPosition,
      head: [['Info']],
      body: [['No expense rows found for the selected filters.']],
      theme: 'grid',
      styles: { fontSize: 9 }
    });
  }

  return doc;
};

const generateSalaryPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Salary Report Summary', 14, yPosition);
  yPosition += 10;

  // Summary table
  const summaryData = [
    ['Total Salary', formatMoney(data.summary?.total_salary)],
    ['Total Employees', String(data.summary?.total_employees || 0)],
    ['Average Salary', formatMoney(data.summary?.average_salary)],
    ['Current Month', formatMoney(data.summary?.current_month_salary)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Department details
  doc.text('Department-wise Salary Details', 14, yPosition);
  yPosition += 8;

  const deptData = (data.departments || []).map(dept => [
    dept.department,
    dept.total_employees,
    dept.active_employees,
    dept.new_hires,
    formatMoney(dept.total_salary),
    formatMoney(dept.average_salary)
  ]);

  if (deptData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Department', 'Total Emp', 'Active', 'New Hires', 'Total Sal', 'Avg Sal']],
      body: deptData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
  }

  return doc;
};

const generateCashFlowPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Cash Flow Report Summary', 14, yPosition);
  yPosition += 10;

  // Summary table
  const summaryData = [
    ['Total Inflow', formatMoney(data.summary?.total_inflow)],
    ['Total Outflow', formatMoney(data.summary?.total_outflow)],
    ['Net Cash Flow', formatMoney(data.summary?.net_cash_flow)],
    ['Opening Balance', formatMoney(data.summary?.opening_balance)]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Transaction details
  doc.text('Transaction Details', 14, yPosition);
  yPosition += 8;

  const transactionData = (data.transactions || []).map(t => [
    t.date ? new Date(t.date).toLocaleDateString() : '-',
    t.type || '-',
    t.description || '-',
    formatMoney(t.amount),
    formatMoney(t.balance),
    t.source || '-'
  ]);

  if (transactionData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Type', 'Description', 'Amount', 'Balance', 'Source']],
      body: transactionData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
  }

  return doc;
};

const generateEmployeesPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Employee Report Summary', 14, yPosition);
  yPosition += 10;

  // Summary table
  const summaryData = [
    ['Total Employees', String(data.summary?.total_employees || 0)],
    ['Active Employees', String(data.summary?.active_employees || 0)],
    ['New Hires (30d)', String(data.summary?.new_hires || 0)],
    ['Attrition Rate', `${data.summary?.attrition_rate || 0}%`]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10 }
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Employee details
  doc.text('Employee Details', 14, yPosition);
  yPosition += 8;

  const employeeData = (data.detailed || []).map(emp => [
    emp.name || '-',
    emp.department || '-',
    emp.status || '-',
    emp.hire_date ? new Date(emp.hire_date).toLocaleDateString() : '-',
    formatMoney(emp.salary)
  ]);

  if (employeeData.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [['Name', 'Department', 'Status', 'Hire Date', 'Salary']],
      body: employeeData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
  }

  return doc;
};

const generateGenericPDF = (doc, data, yPosition) => {
  doc.setFontSize(12);
  doc.text('Report Data', 14, yPosition);
  yPosition += 10;

  // Generic table for any data
  const keys = Object.keys(data);
  if (keys.length > 0) {
    const tableKey = keys[0];
    const rows = data[tableKey];

    if (Array.isArray(rows) && rows.length > 0) {
      const columns = Object.keys(rows[0]);
      const tableData = rows.map(item => columns.map(col => String(item[col] || '')));

      autoTable(doc, {
        startY: yPosition,
        head: [columns],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 9 }
      });
    }
  }

  return doc;
};

module.exports = {
  generatePDFReport
};
