const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Item = require('../models/Item');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const CashFlow = require('../models/CashFlow');
const { generatePDFReport } = require('../utils/reportExporter');

const toStart = (value) => (value ? new Date(`${value}T00:00:00`) : null);
const toEnd = (value) => (value ? new Date(`${value}T23:59:59`) : null);

const withDateRange = (field, fromDate, toDate) => {
  const range = {};
  const start = toStart(fromDate);
  const end = toEnd(toDate);
  if (start) range.$gte = start;
  if (end) range.$lte = end;
  return Object.keys(range).length ? { [field]: range } : {};
};

const getSalesReport = async (req, res, next) => {
  try {
    const { fromDate, toDate, reportType = 'SUMMARY' } = req.query;
    const filter = {
      billType: 'SALES',
      paymentStatus: { $ne: 'CANCELLED' },
      ...withDateRange('createdAt', fromDate, toDate),
    };

    const rows = await Sale.find(filter).sort({ createdAt: 1 });
    const totalSales = rows.reduce((s, x) => s + Number(x.netAmount || 0), 0);
    const totalDiscount = rows.reduce(
      (s, x) => s + Number(x.lineDiscountAmount || 0) + Number(x.billDiscount || 0),
      0
    );
    const totalTax = rows.reduce((s, x) => s + Number(x.taxAmount || 0), 0);
    const totalBills = rows.length;
    const avgBill = totalBills ? totalSales / totalBills : 0;

    // Daily breakdown
    const dayMap = new Map();
    rows.forEach((row) => {
      const key = row.createdAt.toISOString().slice(0, 10);
      const prev = dayMap.get(key) || { bill_date: key, bills: 0, sales: 0, discount: 0, tax: 0 };
      prev.bills += 1;
      prev.sales += Number(row.netAmount || 0);
      prev.discount += Number(row.lineDiscountAmount || 0) + Number(row.billDiscount || 0);
      prev.tax += Number(row.taxAmount || 0);
      dayMap.set(key, prev);
    });

    // Monthly breakdown
    const monthMap = new Map();
    rows.forEach((row) => {
      const d = new Date(row.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthMap.get(key) || { month: key, sales: 0, bills: 0, profit: 0 };
      prev.sales += Number(row.netAmount || 0);
      prev.bills += 1;
      monthMap.set(key, prev);
    });
    const monthly = [...monthMap.values()].map((x) => ({
      ...x,
      sales: Number(x.sales.toFixed(2)),
      bills: x.bills,
    }));

    // Product-wise analysis
    const productMap = new Map();
    rows.forEach((row) => {
      (row.items || []).forEach((line) => {
        const key = String(line.id || line.code || line.name || '');
        if (!key) return;
        const prev = productMap.get(key) || {
          product_id: key,
          product_name: line.name || 'Unknown',
          category: 'General',
          quantity_sold: 0,
          revenue: 0,
          discount: 0,
          tax: 0,
        };
        prev.quantity_sold += Number(line.qty || 0);
        prev.revenue += Number(line.amount || 0);
        prev.discount += Number(line.discount || 0) * Number(line.qty || 0) / 100;
        productMap.set(key, prev);
      });
    });
    const products = [...productMap.values()].sort((a, b) => b.revenue - a.revenue);

    const detailed = rows.map((x) => ({
      invoice_no: x.invoiceNo,
      bill_date: x.createdAt,
      customer_name: x.customerName,
      source: x.source,
      payment_mode: x.paymentMode,
      payment_status: x.paymentStatus,
      net_amount: Number(x.netAmount || 0),
      tax_amount: Number(x.taxAmount || 0),
      discount_amount: Number(x.lineDiscountAmount || 0) + Number(x.billDiscount || 0),
    }));

    res.json({
      success: true,
      data: {
        summary: {
          total_sales: Number(totalSales.toFixed(2)),
          total_bills: totalBills,
          total_discount: Number(totalDiscount.toFixed(2)),
          total_tax: Number(totalTax.toFixed(2)),
          avg_bill_value: Number(avgBill.toFixed(2)),
        },
        dailyBreakdown: [...dayMap.values()],
        monthly: monthly,
        products: products,
        detailed: reportType === 'DETAILED' ? detailed : [],
      },
    });
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const { reportType = 'STOCK', fromDate, toDate } = req.query;
    const items = await Item.find({ is_active: true }).sort({ item_name: 1 });
    const totalItems = items.length;
    const totalStock = items.reduce((s, x) => s + Number(x.stock || 0), 0);
    const totalValue = items.reduce((s, x) => s + Number(x.stock || 0) * Number(x.purchase_price || 0), 0);
    const lowStock = items.filter((x) => Number(x.stock || 0) <= Number(x.min_stock_level || 0));

    const movementFilter = {
      billType: 'SALES',
      paymentStatus: { $ne: 'CANCELLED' },
      ...withDateRange('createdAt', fromDate, toDate),
    };
    const saleRows = await Sale.find(movementFilter);
    const soldMap = new Map();
    saleRows.forEach((bill) => {
      (bill.items || []).forEach((line) => {
        const key = String(line.id || line.code || line.name || '');
        if (!key) return;
        const prev = soldMap.get(key) || { key, item_name: line.name || '', sold_qty: 0, sales_amount: 0 };
        prev.sold_qty += Number(line.qty || 0);
        prev.sales_amount += Number(line.amount || 0);
        soldMap.set(key, prev);
      });
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_items: totalItems,
          total_stock: Number(totalStock.toFixed(2)),
          total_value: Number(totalValue.toFixed(2)),
          low_stock_count: lowStock.length,
        },
        stockItems: items.map((x) => ({
          item_id: x.item_id,
          item_code: x.item_code,
          item_name: x.item_name,
          barcode: x.barcode,
          stock: Number(x.stock || 0),
          min_stock_level: Number(x.min_stock_level || 0),
          purchase_price: Number(x.purchase_price || 0),
          sale_price: Number(x.sale_price || 0),
          stock_value: Number((Number(x.stock || 0) * Number(x.purchase_price || 0)).toFixed(2)),
        })),
        movement: reportType === 'MOVEMENT' ? [...soldMap.values()].sort((a, b) => b.sold_qty - a.sold_qty) : [...soldMap.values()],
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTaxReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const salesFilter = {
      billType: 'SALES',
      paymentStatus: { $ne: 'CANCELLED' },
      ...withDateRange('createdAt', fromDate, toDate),
    };
    const purchaseFilter = {
      status: { $ne: 'CANCELLED' },
      ...withDateRange('purchase_date', fromDate, toDate),
    };

    const [salesRows, purchaseRows] = await Promise.all([
      Sale.find(salesFilter),
      Purchase.find(purchaseFilter),
    ]);

    const outputTax = salesRows.reduce((s, x) => s + Number(x.taxAmount || 0), 0);
    const salesTaxable = salesRows.reduce((s, x) => s + Number(x.taxableAmount || 0), 0);
    const purchaseValue = purchaseRows.reduce((s, x) => s + Number(x.grand_total || 0), 0);
    const inputTax = 0;
    const netTax = outputTax - inputTax;

    res.json({
      success: true,
      data: {
        summary: {
          taxable_sales: Number(salesTaxable.toFixed(2)),
          output_tax: Number(outputTax.toFixed(2)),
          taxable_purchase: Number(purchaseValue.toFixed(2)),
          input_tax: Number(inputTax.toFixed(2)),
          net_tax_payable: Number(netTax.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {
      billType: 'SALES',
      paymentStatus: { $ne: 'CANCELLED' },
      ...withDateRange('createdAt', fromDate, toDate),
    };

    const [salesRows, customers] = await Promise.all([
      Sale.find(filter),
      Customer.find({}),
    ]);

    const map = new Map();
    salesRows.forEach((row) => {
      const key = String(row.customerId || row.customerCode || row.customerName || 'UNKNOWN');
      const prev = map.get(key) || {
        key,
        customer_id: row.customerId || row.customerCode || '',
        customer_name: row.customerName || 'Cash Customer',
        total_bills: 0,
        total_purchase: 0,
        total_paid: 0,
        total_due: 0,
        total_quantity: 0,
      };
      prev.total_bills += 1;
      prev.total_purchase += Number(row.netAmount || 0);
      prev.total_paid += Number(row.paidAmount || 0);
      prev.total_due += Number(row.dueAmount || 0);

      // Calculate total quantity from items
      (row.items || []).forEach((item) => {
        prev.total_quantity += Number(item.qty || 0);
      });

      map.set(key, prev);
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_customers: customers.length,
          billed_customers: map.size,
          total_purchase: Number(
            [...map.values()].reduce((s, x) => s + x.total_purchase, 0).toFixed(2)
          ),
          total_due: Number(
            [...map.values()].reduce((s, x) => s + x.total_due, 0).toFixed(2)
          ),
        },
        customers: [...map.values()].sort((a, b) => b.total_purchase - a.total_purchase),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSupplierReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {
      status: { $ne: 'CANCELLED' },
      ...withDateRange('purchase_date', fromDate, toDate),
    };
    const [purchaseRows, suppliers] = await Promise.all([
      Purchase.find(filter),
      Supplier.find({}),
    ]);

    const map = new Map();
    purchaseRows.forEach((row) => {
      const key = String(row.supplier_id || row.supplier_code || row.supplier_name || 'UNKNOWN');
      const prev = map.get(key) || {
        key,
        supplier_id: row.supplier_id || '',
        supplier_name: row.supplier_name || '',
        total_bills: 0,
        total_purchase: 0,
        total_paid: 0,
        total_due: 0,
      };
      prev.total_bills += 1;
      prev.total_purchase += Number(row.grand_total || 0);
      prev.total_paid += Number(row.paid_amount || 0);
      prev.total_due += Number(row.due_amount || 0);
      map.set(key, prev);
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_suppliers: suppliers.length,
          active_suppliers: map.size,
          total_purchase: Number(
            [...map.values()].reduce((s, x) => s + x.total_purchase, 0).toFixed(2)
          ),
          total_due: Number([...map.values()].reduce((s, x) => s + x.total_due, 0).toFixed(2)),
        },
        suppliers: [...map.values()].sort((a, b) => b.total_purchase - a.total_purchase),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getDayEndReport = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const [salesRows, purchaseRows] = await Promise.all([
      Sale.find({
        billType: 'SALES',
        paymentStatus: { $ne: 'CANCELLED' },
        createdAt: { $gte: start, $lte: end },
      }),
      Purchase.find({
        status: { $ne: 'CANCELLED' },
        purchase_date: { $gte: start, $lte: end },
      }),
    ]);

    const salesAmount = salesRows.reduce((s, x) => s + Number(x.netAmount || 0), 0);
    const purchaseAmount = purchaseRows.reduce((s, x) => s + Number(x.grand_total || 0), 0);
    const collectionAmount = salesRows.reduce((s, x) => s + Number(x.paidAmount || 0), 0);
    const supplierPayment = purchaseRows.reduce((s, x) => s + Number(x.paid_amount || 0), 0);

    res.json({
      success: true,
      data: {
        date,
        sales_bills: salesRows.length,
        purchase_bills: purchaseRows.length,
        sales_amount: Number(salesAmount.toFixed(2)),
        purchase_amount: Number(purchaseAmount.toFixed(2)),
        customer_collections: Number(collectionAmount.toFixed(2)),
        supplier_payments: Number(supplierPayment.toFixed(2)),
        cash_delta: Number((collectionAmount - supplierPayment).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProfitLossReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const [salesRows, purchaseRows] = await Promise.all([
      Sale.find({
        billType: 'SALES',
        paymentStatus: { $ne: 'CANCELLED' },
        ...withDateRange('createdAt', fromDate, toDate),
      }),
      Purchase.find({
        status: { $ne: 'CANCELLED' },
        ...withDateRange('purchase_date', fromDate, toDate),
      }),
    ]);

    const salesAmount = salesRows.reduce((s, x) => s + Number(x.netAmount || 0), 0);
    const purchaseAmount = purchaseRows.reduce((s, x) => s + Number(x.grand_total || 0), 0);
    const grossProfit = salesAmount - purchaseAmount;
    const marginPct = salesAmount > 0 ? (grossProfit / salesAmount) * 100 : 0;

    // Get expenses for net profit calculation
    const expenseRows = await Expense.find({
      ...withDateRange('date', fromDate, toDate),
    });
    const totalExpenses = expenseRows.reduce((s, x) => s + Number(x.amount || 0), 0);
    const netProfit = grossProfit - totalExpenses;
    const netMarginPct = salesAmount > 0 ? (netProfit / salesAmount) * 100 : 0;

    const monthMap = new Map();
    salesRows.forEach((x) => {
      const d = new Date(x.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthMap.get(key) || { month: key, sales: 0, purchase: 0, profit: 0 };
      prev.sales += Number(x.netAmount || 0);
      monthMap.set(key, prev);
    });
    purchaseRows.forEach((x) => {
      const d = new Date(x.purchase_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthMap.get(key) || { month: key, sales: 0, purchase: 0, profit: 0 };
      prev.purchase += Number(x.grand_total || 0);
      monthMap.set(key, prev);
    });
    const monthly = [...monthMap.values()].map((x) => ({
      ...x,
      sales: Number(x.sales.toFixed(2)),
      purchase: Number(x.purchase.toFixed(2)),
      profit: Number((x.sales - x.purchase).toFixed(2)),
    }));

    // Calculate product-wise profit
    const productMap = new Map();
    salesRows.forEach((row) => {
      (row.items || []).forEach((line) => {
        const key = String(line.id || line.code || line.name || '');
        if (!key) return;
        const prev = productMap.get(key) || {
          product_id: key,
          product_name: line.name || 'Unknown',
          category: line.category || 'General',
          quantity_sold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
        prev.quantity_sold += Number(line.qty || 0);
        prev.revenue += Number(line.amount || 0);
        // Estimate cost (70% of revenue as typical for textile business)
        const lineCost = Number(line.amount || 0) * 0.7;
        prev.cost += lineCost;
        productMap.set(key, prev);
      });
    });

    // Calculate profit for each product
    const products = [...productMap.values()].map(p => ({
      ...p,
      profit: Number((p.revenue - p.cost).toFixed(2)),
      margin_pct: p.revenue > 0 ? Number(((p.revenue - p.cost) / p.revenue * 100).toFixed(2)) : 0
    })).sort((a, b) => b.profit - a.profit);

    // Calculate customer-wise profit
    const customerMap = new Map();
    salesRows.forEach((row) => {
      const key = String(row.customerId || row.customer_id || '');
      if (!key) return;
      const prev = customerMap.get(key) || {
        customer_id: key,
        customer_name: row.customerName || 'Unknown',
        total_purchase: 0,
        total_quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
      prev.total_purchase += 1;
      prev.revenue += Number(row.netAmount || 0);
      // Estimate cost (70% of revenue as typical for textile business)
      const saleCost = Number(row.netAmount || 0) * 0.7;
      prev.cost += saleCost;

      // Calculate total quantity
      (row.items || []).forEach((item) => {
        prev.total_quantity += Number(item.qty || 0);
      });

      customerMap.set(key, prev);
    });

    // Calculate profit for each customer
    const customers = [...customerMap.values()].map(c => ({
      ...c,
      profit: Number((c.revenue - c.cost).toFixed(2)),
      margin_pct: c.revenue > 0 ? Number(((c.revenue - c.cost) / c.revenue * 100).toFixed(2)) : 0
    })).sort((a, b) => b.profit - a.profit);

    res.json({
      success: true,
      data: {
        summary: {
          sales_amount: Number(salesAmount.toFixed(2)),
          purchase_amount: Number(purchaseAmount.toFixed(2)),
          gross_profit: Number(grossProfit.toFixed(2)),
          net_profit: Number(netProfit.toFixed(2)),
          margin_pct: Number(marginPct.toFixed(2)),
          net_margin_pct: Number(netMarginPct.toFixed(2)),
        },
        monthly: monthly.length > 0 ? monthly : [
          { month: new Date().toISOString().slice(0, 7), sales: 0, purchase: 0, profit: 0 }
        ],
        products: products.length > 0 ? products : [
          {
            product_id: 'SAMPLE001',
            product_name: 'Sample Product',
            category: 'General',
            quantity_sold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin_pct: 0
          }
        ],
        customers: customers.length > 0 ? customers : [
          {
            customer_id: 'CUST001',
            customer_name: 'Sample Customer',
            total_purchase: 0,
            total_quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            margin_pct: 0
          }
        ],
      },
    });
  } catch (error) {
    next(error);
  }
};

const exportReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { fromDate, toDate } = req.query;

    let data;

    // Get the actual report data based on type
    switch (reportType) {
      case 'sales':
        data = await getSalesReportData(req.query);
        break;
      case 'inventory':
        data = await getInventoryReportData(req.query);
        break;
      case 'expenses':
        data = await getExpenseReportData(req.query);
        break;
      case 'salary':
        data = await getSalaryReportData(req.query);
        break;
      case 'cashflow':
        data = await getCashFlowReportData(req.query);
        break;
      case 'employees':
        data = await getEmployeeReportData(req.query);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    // Generate PDF
    const doc = generatePDFReport(data, reportType, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf"`);

    // Send PDF
    res.send(Buffer.from(doc.output('arraybuffer')));

  } catch (error) {
    console.error('PDF Export Error:', error);
    next(error);
  }
};

// Helper functions to get report data for export
const getSalesReportData = async (query) => {
  const { fromDate, toDate } = query;
  const filter = {
    billType: 'SALES',
    paymentStatus: { $ne: 'CANCELLED' },
    ...withDateRange('createdAt', fromDate, toDate),
  };

  const rows = await Sale.find(filter).sort({ createdAt: 1 });
  const totalSales = rows.reduce((s, x) => s + Number(x.netAmount || 0), 0);
  const totalDiscount = rows.reduce(
    (s, x) => s + Number(x.lineDiscountAmount || 0) + Number(x.billDiscount || 0),
    0
  );
  const totalTax = rows.reduce((s, x) => s + Number(x.taxAmount || 0), 0);
  const totalBills = rows.length;

  const dayMap = new Map();
  rows.forEach((row) => {
    const key = row.createdAt.toISOString().slice(0, 10);
    const prev = dayMap.get(key) || { bill_date: key, bills: 0, sales: 0, discount: 0, tax: 0 };
    prev.bills += 1;
    prev.sales += Number(row.netAmount || 0);
    prev.discount += Number(row.lineDiscountAmount || 0) + Number(row.billDiscount || 0);
    prev.tax += Number(row.taxAmount || 0);
    dayMap.set(key, prev);
  });

  return {
    summary: {
      total_sales: Number(totalSales.toFixed(2)),
      total_bills: totalBills,
      total_discount: Number(totalDiscount.toFixed(2)),
      total_tax: Number(totalTax.toFixed(2)),
    },
    dailyBreakdown: [...dayMap.values()]
  };
};

const getExpenseReportData = async (query) => {
  const { fromDate, toDate } = query;
  const filter = {
    ...withDateRange('date', fromDate, toDate),
  };

  const expenses = await Expense.find(filter).sort({ date: -1 });

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const operatingExpenses = expenses.filter(exp => exp.category === 'Operating').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const administrativeExpenses = expenses.filter(exp => exp.category === 'Administrative').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const marketingExpenses = expenses.filter(exp => exp.category === 'Marketing').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const maintenanceExpenses = expenses.filter(exp => exp.category === 'Maintenance').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const salaryExpenses = expenses.filter(exp => exp.category === 'Salary').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const otherExpenses = expenses
    .filter(exp => exp.category === 'Other' || !['Operating', 'Administrative', 'Marketing', 'Maintenance', 'Salary'].includes(exp.category))
    .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

  const categoryMap = new Map();
  expenses.forEach(exp => {
    const category = exp.category || 'Other';
    const prev = categoryMap.get(category) || { category, amount: 0 };
    prev.amount += Number(exp.amount || 0);
    categoryMap.set(category, prev);
  });

  return {
    summary: {
      total_expenses: Number(totalExpenses.toFixed(2)),
      operating_expenses: Number(operatingExpenses.toFixed(2)),
      administrative_expenses: Number(administrativeExpenses.toFixed(2)),
      marketing_expenses: Number(marketingExpenses.toFixed(2)),
      maintenance_expenses: Number(maintenanceExpenses.toFixed(2)),
      salary_expenses: Number(salaryExpenses.toFixed(2)),
      other_expenses: Number(otherExpenses.toFixed(2)),
    },
    expenses: [...categoryMap.values()],
    detailed: expenses.map(exp => ({
      date: exp.date,
      category: exp.category,
      description: exp.description,
      amount: Number(exp.amount || 0),
      payment_method: exp.payment_method,
      created_by: exp.created_by,
    }))
  };
};

const getSalaryReportData = async (query) => {
  const { fromDate, toDate } = query;
  const filter = {
    ...withDateRange('payment_date', fromDate, toDate),
  };

  const [employees, salaries] = await Promise.all([
    Employee.find({ status: 'Active' }),
    Expense.find({
      category: { $regex: /^salary$/i },
      ...withDateRange('date', fromDate, toDate)
    }).sort({ date: -1 })
  ]);

  const totalDefinedSalary = employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0);
  const totalPaidSalary = salaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0);
  const totalSalary = totalPaidSalary || totalDefinedSalary; // Use paid if exists, else defined
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const avgSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;

  const currentMonthSalary = salaries.filter(sal => {
    const salDate = sal.date ? new Date(sal.date) : (sal.payment_date ? new Date(sal.payment_date) : null);
    if (!salDate) return false;
    const now = new Date();
    return salDate.getMonth() === now.getMonth() && salDate.getFullYear() === now.getFullYear();
  }).reduce((sum, sal) => sum + Number(sal.amount || 0), 0);

  const deptMap = new Map();
  employees.forEach(emp => {
    const dept = emp.department || 'General';
    const prev = deptMap.get(dept) || {
      department: dept,
      employee_count: 0,
      total_salary: 0,
      new_hires: 0,
      average_salary: 0
    };
    if (emp.status === 'Active') {
      prev.employee_count += 1;
      prev.total_salary += Number(emp.salary || 0); // Include base salary by default
    }
    if (emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      prev.new_hires += 1;
    }
    deptMap.set(dept, prev);
  });

  salaries.forEach(sal => {
    if (sal.employee_id) {
      const emp = employees.find(e => e._id.toString() === sal.employee_id.toString());
      if (emp) {
        const dept = emp.department || 'General';
        const prev = deptMap.get(dept);
        if (prev) {
          prev.total_salary += Number(sal.amount || 0);
        }
      }
    }
  });

  deptMap.forEach(dept => {
    dept.average_salary = dept.employee_count > 0 ? dept.total_salary / dept.employee_count : 0;
  });

  return {
    summary: {
      total_salary: Number(totalSalary.toFixed(2)),
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      new_hires: [...deptMap.values()].reduce((sum, dept) => sum + dept.new_hires, 0),
      average_salary: Number(avgSalary.toFixed(2)),
      current_month_salary: Number(currentMonthSalary.toFixed(2)),
    },
    departments: [...deptMap.values()]
  };
};

const getCashFlowReportData = async (query) => {
  const { fromDate, toDate } = query;
  const filter = {
    ...withDateRange('date', fromDate, toDate),
  };

  const [transactions, salesRows, purchaseRows] = await Promise.all([
    CashFlow.find(filter).sort({ date: -1 }),
    Sale.find({ billType: 'SALES', paymentStatus: { $ne: 'CANCELLED' }, ...withDateRange('createdAt', fromDate, toDate) }),
    Purchase.find({ status: { $ne: 'CANCELLED' }, ...withDateRange('purchase_date', fromDate, toDate) })
  ]);

  const totalInflow = transactions.filter(t => t.type === 'Inflow').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalOutflow = transactions.filter(t => t.type === 'Outflow').reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netCashFlow = totalInflow - totalOutflow;
  const openingBalance = transactions.length > 0 ? Math.min(...transactions.map(t => Number(t.balance || 0))) : 0;

  let allTransactions = [...transactions];

  if (salesRows.length > 0) {
    salesRows.forEach(sale => {
      allTransactions.push({
        date: sale.createdAt,
        type: 'Inflow',
        description: `Sales - ${sale.invoiceNo}`,
        amount: Number(sale.paidAmount || 0),
        balance: 0,
        source: 'Sales'
      });
    });
  }

  if (purchaseRows.length > 0) {
    purchaseRows.forEach(purchase => {
      allTransactions.push({
        date: purchase.purchase_date,
        type: 'Outflow',
        description: `Purchase - ${purchase.bill_no}`,
        amount: Number(purchase.paid_amount || 0),
        balance: 0,
        source: 'Purchase'
      });
    });
  }

  allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  let runningBalance = openingBalance;
  allTransactions.forEach(t => {
    if (t.type === 'Inflow') {
      runningBalance += Number(t.amount || 0);
    } else {
      runningBalance -= Number(t.amount || 0);
    }
    t.balance = runningBalance;
  });

  return {
    summary: {
      total_inflow: Number(totalInflow.toFixed(2)),
      total_outflow: Number(totalOutflow.toFixed(2)),
      net_cash_flow: Number(netCashFlow.toFixed(2)),
      opening_balance: Number(openingBalance.toFixed(2)),
    },
    transactions: allTransactions.slice(0, 100).map(t => ({
      date: t.date,
      type: t.type,
      description: t.description,
      amount: Number(t.amount || 0),
      balance: Number(t.balance || 0),
      source: t.source || 'Manual'
    }))
  };
};

const getEmployeeReportData = async (query) => {
  const { fromDate, toDate } = query;

  const [employees, expenses, salesData] = await Promise.all([
    Employee.find({}),
    Expense.find({ category: 'Salary', ...withDateRange('payment_date', fromDate, toDate) }),
    Sale.find({
      billType: 'SALES',
      paymentStatus: { $ne: 'CANCELLED' },
      ...withDateRange('createdAt', fromDate, toDate),
    })
  ]);

  // Calculate summary
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const newHires = employees.filter(emp => emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const attritionRate = totalEmployees > 0 ? (employees.filter(emp => emp.status === 'Inactive').length / totalEmployees * 100) : 0;

  // Group by department
  const deptMap = new Map();
  employees.forEach(emp => {
    const dept = emp.department || 'General';
    const prev = deptMap.get(dept) || {
      department: dept,
      total_employees: 0,
      active_employees: 0,
      new_hires: 0,
      total_salary: 0,
      average_salary: 0
    };
    prev.total_employees += 1;
    if (emp.status === 'Active') prev.active_employees += 1;
    if (emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      prev.new_hires += 1;
    }
    prev.total_salary += Number(emp.salary || 0);
    deptMap.set(dept, prev);
  });

  // Calculate sales team performance for sales department
  const salesEmployees = employees.filter(emp => emp.department === 'Sales');
  const salesTeamData = [];

  const totalSalesAmount = salesData.reduce((sum, sale) => sum + Number(sale.netAmount || 0), 0);
  const avgSalesPerEmployee = salesEmployees.length > 0 ? totalSalesAmount / salesEmployees.length : 0;

  salesEmployees.forEach(emp => {
    const salesTarget = avgSalesPerEmployee > 0 ? avgSalesPerEmployee * 1.2 : 50000;

    const contributionWeight = emp.salary > 0 ? emp.salary : 1;
    const totalSalaryWeight = salesEmployees.reduce((s, e) => s + (e.salary > 0 ? e.salary : 1), 0);

    const salesAchieved = totalSalesAmount * (contributionWeight / totalSalaryWeight);

    salesTeamData.push({
      employee_id: emp._id,
      employee_name: emp.name,
      position: emp.position,
      department: emp.department,
      sales_target: Math.round(salesTarget),
      sales_achieved: Math.round(salesAchieved),
      target_month: new Date().toISOString().slice(0, 7),
      commission_rate: 0.05,
      commission_earned: Math.round(salesAchieved * 0.05)
    });
  });

  // Calculate averages
  deptMap.forEach(dept => {
    dept.average_salary = dept.active_employees > 0 ? dept.total_salary / dept.active_employees : 0;
  });

  // Compute Monthly Performance from actual sales data
  const monthMap = new Map();
  salesData.forEach(sale => {
    const d = new Date(sale.createdAt);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const prev = monthMap.get(monthStr) || { month: monthStr, actual_sales: 0 };
    prev.actual_sales += Number(sale.netAmount || 0);
    monthMap.set(monthStr, prev);
  });

  const monthlyPerformance = Array.from(monthMap.values()).map(m => {
    m.target_sales = salesEmployees.length > 0 ? salesEmployees.length * 50000 : 0;
    return m;
  }).sort((a, b) => a.month.localeCompare(b.month));

  return {
    summary: {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      new_hires: newHires,
      attrition_rate: Number(attritionRate.toFixed(2)),
    },
    departments: [...deptMap.values()],
    salesTeam: salesTeamData,
    monthlyPerformance: monthlyPerformance,
    detailed: employees.map(emp => ({
      id: emp._id,
      employee_name: emp.name,
      name: emp.name,
      department: emp.department,
      status: emp.status,
      hire_date: emp.hire_date,
      salary: emp.salary || 0,
    }))
  };
};

const getExpenseReport = async (req, res, next) => {
  try {
    const { fromDate, toDate, budgetYear, budgetPeriod } = req.query;
    const filter = {
      ...withDateRange('date', fromDate, toDate),
    };

    if (budgetYear) filter.budget_year = parseInt(budgetYear);
    if (budgetPeriod) filter.budget_period = budgetPeriod;

    const expenses = await Expense.find(filter).sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const operatingExpenses = expenses.filter(exp => exp.category === 'Operating').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const administrativeExpenses = expenses.filter(exp => exp.category === 'Administrative').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const marketingExpenses = expenses.filter(exp => exp.category === 'Marketing').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const maintenanceExpenses = expenses.filter(exp => exp.category === 'Maintenance').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const salaryExpenses = expenses.filter(exp => exp.category === 'Salary').reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const otherExpenses = expenses.filter(exp => exp.category === 'Other' || !['Operating', 'Administrative', 'Marketing', 'Maintenance', 'Salary'].includes(exp.category)).reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // Budget analysis
    const totalBudgetAllocated = expenses.reduce((sum, exp) => sum + Number(exp.budget_allocated || 0), 0);
    const totalBudgetRemaining = expenses.reduce((sum, exp) => sum + Number(exp.budget_remaining || 0), 0);
    const totalBudgetVariance = expenses.reduce((sum, exp) => sum + Number(exp.budget_variance || 0), 0);
    const exceededExpenses = expenses.filter(exp => exp.is_budget_exceeded).length;
    const budgetUtilization = totalBudgetAllocated > 0 ? ((totalExpenses / totalBudgetAllocated) * 100).toFixed(2) : 0;

    const categoryMap = new Map();
    expenses.forEach(exp => {
      const category = exp.category || 'Other';
      const prev = categoryMap.get(category) || {
        category,
        amount: 0,
        budget_allocated: 0,
        budget_remaining: 0,
        budget_variance: 0,
        count: 0,
        exceeded_count: 0
      };
      prev.amount += Number(exp.amount || 0);
      prev.budget_allocated += Number(exp.budget_allocated || 0);
      prev.budget_remaining += Number(exp.budget_remaining || 0);
      prev.budget_variance += Number(exp.budget_variance || 0);
      prev.count += 1;
      if (exp.is_budget_exceeded) prev.exceeded_count += 1;
      categoryMap.set(category, prev);
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_expenses: Number(totalExpenses.toFixed(2)),
          operating_expenses: Number(operatingExpenses.toFixed(2)),
          administrative_expenses: Number(administrativeExpenses.toFixed(2)),
          marketing_expenses: Number(marketingExpenses.toFixed(2)),
          maintenance_expenses: Number(maintenanceExpenses.toFixed(2)),
          salary_expenses: Number(salaryExpenses.toFixed(2)),
          other_expenses: Number(otherExpenses.toFixed(2)),
          // Budget summary
          total_budget_allocated: Number(totalBudgetAllocated.toFixed(2)),
          total_budget_remaining: Number(totalBudgetRemaining.toFixed(2)),
          total_budget_variance: Number(totalBudgetVariance.toFixed(2)),
          exceeded_expenses_count: exceededExpenses,
          budget_utilization_percent: Number(budgetUtilization),
        },
        category_breakdown: [...categoryMap.values()],
        expenses: expenses.map(exp => ({
          id: exp._id?.toString?.() || exp.id,
          date: exp.date,
          category: exp.category,
          description: exp.description,
          amount: Number(exp.amount || 0),
          status: exp.status || 'PENDING',
          payment_method: exp.payment_method,
          created_by: exp.created_by,
          budget_year: exp.budget_year,
          budget_period: exp.budget_period,
          budget_category: exp.budget_category,
          budget_allocated: Number(exp.budget_allocated || 0),
          budget_remaining: Number(exp.budget_remaining || 0),
          budget_variance: Number(exp.budget_variance || 0),
          is_budget_exceeded: exp.is_budget_exceeded,
          expense_date: exp.date,
          expense_category: exp.category,
          expense_description: exp.description,
          payment_mode: exp.payment_method,
          reference_number: exp.receipt_number,
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSalaryReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {
      ...withDateRange('payment_date', fromDate, toDate),
    };

    const [employees, salaries] = await Promise.all([
      Employee.find({ status: 'Active' }),
      Expense.find({
        category: { $regex: /^salary$/i },
        ...withDateRange('date', fromDate, toDate)
      }).sort({ date: -1 })
    ]);

    // Calculate summary
    const totalDefinedSalary = employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0);
    const totalPaidSalary = salaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0);
    const totalSalary = totalPaidSalary || totalDefinedSalary;
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
    const avgSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;

    const currentMonthSalary = salaries.filter(sal => {
      const salDate = sal.date ? new Date(sal.date) : (sal.payment_date ? new Date(sal.payment_date) : null);
      if (!salDate) return false;
      const now = new Date();
      return salDate.getMonth() === now.getMonth() && salDate.getFullYear() === now.getFullYear();
    }).reduce((sum, sal) => sum + Number(sal.amount || 0), 0);

    // Group by department
    const deptMap = new Map();
    employees.forEach(emp => {
      const dept = emp.department || 'General';
      const prev = deptMap.get(dept) || {
        department: dept,
        employee_count: 0,
        total_salary: 0,
        new_hires: 0,
        average_salary: 0
      };
      if (emp.status === 'Active') {
        prev.employee_count += 1;
        prev.total_salary += Number(emp.salary || 0); // Include base salary
      }
      if (emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        prev.new_hires += 1;
      }
      deptMap.set(dept, prev);
    });

    // Add salary data to departments
    salaries.forEach(sal => {
      if (sal.employee_id) {
        const emp = employees.find(e => e._id.toString() === sal.employee_id.toString());
        if (emp) {
          const dept = emp.department || 'General';
          const prev = deptMap.get(dept);
          if (prev) {
            prev.total_salary += Number(sal.amount || 0);
          }
        }
      }
    });

    deptMap.forEach(dept => {
      dept.average_salary = dept.employee_count > 0 ? dept.total_salary / dept.employee_count : 0;
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_salary: Number(totalSalary.toFixed(2)),
          total_employees: totalEmployees,
          active_employees: activeEmployees,
          new_hires: [...deptMap.values()].reduce((sum, dept) => sum + dept.new_hires, 0),
          average_salary: Number(avgSalary.toFixed(2)),
          current_month_salary: Number(currentMonthSalary.toFixed(2)),
        },
        departments: [...deptMap.values()],
        detailed: salaries.map(sal => ({
          id: sal._id,
          employee_id: sal.employee_id,
          payment_date: sal.payment_date,
          amount: Number(sal.amount || 0),
          payment_method: sal.payment_method,
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCashFlowReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    const filter = {
      ...withDateRange('date', fromDate, toDate),
    };

    const [transactions, salesRows, purchaseRows] = await Promise.all([
      CashFlow.find(filter).sort({ date: -1 }),
      Sale.find({ billType: 'SALES', paymentStatus: { $ne: 'CANCELLED' }, ...withDateRange('createdAt', fromDate, toDate) }),
      Purchase.find({ status: { $ne: 'CANCELLED' }, ...withDateRange('purchase_date', fromDate, toDate) })
    ]);

    const openingBalance = transactions.length > 0 ? Math.min(...transactions.map(t => Number(t.balance || 0))) : 0;

    // Generate transactions from sales and purchases if not enough data
    let allTransactions = [...transactions];

    if (salesRows.length > 0) {
      salesRows.forEach(sale => {
        allTransactions.push({
          date: sale.createdAt,
          type: 'Inflow',
          description: `Sales - ${sale.invoiceNo}`,
          amount: Number(sale.paidAmount || 0),
          balance: 0,
          source: 'Sales'
        });
      });
    }

    if (purchaseRows.length > 0) {
      purchaseRows.forEach(purchase => {
        allTransactions.push({
          date: purchase.purchase_date,
          type: 'Outflow',
          description: `Purchase - ${purchase.bill_no}`,
          amount: Number(purchase.paid_amount || 0),
          balance: 0,
          source: 'Purchase'
        });
      });
    }

    // Sort and calculate running balance
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = openingBalance;
    allTransactions.forEach(t => {
      if (t.type === 'Inflow') {
        runningBalance += Number(t.amount || 0);
      } else {
        runningBalance -= Number(t.amount || 0);
      }
      t.balance = runningBalance;
    });

    // Calculate summary from full transaction set (manual + derived sales/purchases)
    const totalInflow = allTransactions
      .filter(t => t.type === 'Inflow')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalOutflow = allTransactions
      .filter(t => t.type === 'Outflow')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const netCashFlow = totalInflow - totalOutflow;

    res.json({
      success: true,
      data: {
        summary: {
          total_inflow: Number(totalInflow.toFixed(2)),
          total_outflow: Number(totalOutflow.toFixed(2)),
          net_cash_flow: Number(netCashFlow.toFixed(2)),
          opening_balance: Number(openingBalance.toFixed(2)),
        },
        transactions: allTransactions.slice(0, 100).map(t => ({
          id: t._id,
          date: t.date,
          type: t.type,
          description: t.description,
          amount: Number(t.amount || 0),
          balance: Number(t.balance || 0),
          source: t.source || 'Manual'
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeReportDataOld = async (query) => {
  const { fromDate, toDate } = query;
  const [employees, expenses] = await Promise.all([
    Employee.find({}),
    Expense.find({ category: 'Salary', ...withDateRange('payment_date', fromDate, toDate) }),
  ]);

  // Calculate summary
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'Active').length;
  const newHires = employees.filter(emp => emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const attritionRate = totalEmployees > 0 ? (employees.filter(emp => emp.status === 'Inactive').length / totalEmployees * 100) : 0;

  // Group by department
  const deptMap = new Map();
  employees.forEach(emp => {
    const dept = emp.department || 'General';
    const prev = deptMap.get(dept) || {
      department: dept,
      total_employees: 0,
      active_employees: 0,
      new_hires: 0,
      total_salary: 0,
      average_salary: 0
    };
    prev.total_employees += 1;
    if (emp.status === 'Active') prev.active_employees += 1;
    if (emp.hire_date && new Date(emp.hire_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      prev.new_hires += 1;
    }
    prev.total_salary += Number(emp.salary || 0);
    deptMap.set(dept, prev);
  });

  // Calculate sales team performance for sales department
  const salesEmployees = employees.filter(emp => emp.department === 'Sales');
  const salesTeamData = [];

  // Get sales data for sales team performance calculation
  const salesData = await Sale.find({
    billType: 'SALES',
    paymentStatus: { $ne: 'CANCELLED' },
    ...withDateRange('createdAt', fromDate, toDate),
  });

  // Calculate total sales for target setting
  const totalSalesAmount = salesData.reduce((sum, sale) => sum + Number(sale.netAmount || 0), 0);
  const avgSalesPerEmployee = salesEmployees.length > 0 ? totalSalesAmount / salesEmployees.length : 0;

  salesEmployees.forEach(emp => {
    // Set a generic base target or derived from historical performance
    const salesTarget = avgSalesPerEmployee > 0 ? avgSalesPerEmployee * 1.2 : 50000;

    // Calculate actual sales generated by this employee
    // Since Sale model doesn't link directly to employee by default, we estimate or use tracking if available.
    // If there's an employee tracking, we'd use it. For now, we distribute proportionally based on their salary 
    // or just assume 0 if we can't tie it, but better to tie evenly if there's no tracking, to reflect team effort.
    const contributionWeight = emp.salary > 0 ? emp.salary : 1;
    const totalSalaryWeight = salesEmployees.reduce((s, e) => s + (e.salary > 0 ? e.salary : 1), 0);

    const salesAchieved = totalSalesAmount * (contributionWeight / totalSalaryWeight);

    salesTeamData.push({
      employee_id: emp._id,
      employee_name: emp.name,
      position: emp.position,
      department: emp.department,
      sales_target: Math.round(salesTarget),
      sales_achieved: Math.round(salesAchieved),
      target_month: new Date().toISOString().slice(0, 7),
      commission_rate: 0.05,
      commission_earned: Math.round(salesAchieved * 0.05)
    });
  });

  // Calculate averages
  deptMap.forEach(dept => {
    dept.average_salary = dept.active_employees > 0 ? dept.total_salary / dept.active_employees : 0;
  });

  // Compute Monthly Performance from actual sales data
  const monthMap = new Map();
  salesData.forEach(sale => {
    const d = new Date(sale.createdAt);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const prev = monthMap.get(monthStr) || { month: monthStr, actual_sales: 0 };
    prev.actual_sales += Number(sale.netAmount || 0);
    monthMap.set(monthStr, prev);
  });

  const monthlyPerformance = Array.from(monthMap.values()).map(m => {
    m.target_sales = salesEmployees.length > 0 ? salesEmployees.length * 50000 : 0;
    return m;
  }).sort((a, b) => a.month.localeCompare(b.month));

  return {
    summary: {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      new_hires: newHires,
      attrition_rate: Number(attritionRate.toFixed(2)),
    },
    departments: [...deptMap.values()],
    salesTeam: salesTeamData,
    monthlyPerformance: monthlyPerformance,
    detailed: employees.map(emp => ({
      id: emp._id,
      employee_name: emp.name,
      department: emp.department,
      status: emp.status,
      hire_date: emp.hire_date,
      salary: emp.salary || 0,
    }))
  };
};

const getInventoryReportData = async (query) => {
  const { fromDate, toDate } = query;
  const items = await Item.find({ is_active: true }).sort({ item_name: 1 });

  const totalItems = items.length;
  const totalStock = items.reduce((s, x) => s + Number(x.stock || 0), 0);
  const totalValue = items.reduce((s, x) => s + Number(x.stock || 0) * Number(x.purchase_price || 0), 0);
  const lowStock = items.filter((x) => Number(x.stock || 0) <= Number(x.min_stock_level || 0));

  const movementFilter = {
    billType: 'SALES',
    paymentStatus: { $ne: 'CANCELLED' },
    ...withDateRange('createdAt', fromDate, toDate),
  };
  const saleRows = await Sale.find(movementFilter);
  const soldMap = new Map();
  saleRows.forEach((bill) => {
    (bill.items || []).forEach((line) => {
      const key = String(line.id || line.code || line.name || '');
      if (!key) return;
      const prev = soldMap.get(key) || { item_name: line.name || '', sold_qty: 0, sales_amount: 0 };
      prev.sold_qty += Number(line.qty || 0);
      prev.sales_amount += Number(line.amount || 0);
      soldMap.set(key, prev);
    });
  });

  return {
    summary: {
      total_items: totalItems,
      total_stock: Number(totalStock.toFixed(2)),
      total_value: Number(totalValue.toFixed(2)),
      low_stock_count: lowStock.length,
    },
    stockItems: items.map((x) => ({
      item_id: x.item_id,
      item_code: x.item_code,
      item_name: x.item_name,
      stock: Number(x.stock || 0),
      min_stock_level: Number(x.min_stock_level || 0),
      purchase_price: Number(x.purchase_price || 0),
      sale_price: Number(x.sale_price || 0),
      stock_value: Number((Number(x.stock || 0) * Number(x.purchase_price || 0)).toFixed(2)),
    })),
    movement: [...soldMap.values()]
  };
};

const getEmployeeReport = async (req, res, next) => {
  try {
    const data = await getEmployeeReportData(req.query);

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getInventoryReport,
  getTaxReport,
  getCustomerReport,
  getSupplierReport,
  getDayEndReport,
  getProfitLossReport,
  getExpenseReport,
  getSalaryReport,
  getCashFlowReport,
  getEmployeeReport,
  exportReport
};
