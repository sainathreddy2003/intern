const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const supplierRoutes = require('./routes/suppliers');
const itemRoutes = require('./routes/items');
const salesRoutes = require('./routes/sales');
const purchaseRoutes = require('./routes/purchase');
const inventoryRoutes = require('./routes/inventory');
const reportsRoutes = require('./routes/reports');
const syncRoutes = require('./routes/sync');
const securityRoutes = require('./routes/security');
const expensesRoutes = require('./routes/expenses');
const employeesRoutes = require('./routes/employees');
const payrollRoutes = require('./routes/payroll');
const budgetsRoutes = require('./routes/budgets');
const warehousesRoutes = require('./routes/warehouse');
const returnRoutes = require('./routes/return');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { attachTenantContext } = require('./middleware/tenant');

const app = express();

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(
  express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', attachTenantContext);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/budgets', budgetsRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/warehouse', warehousesRoutes);
app.use('/api/returns', returnRoutes);

const clientBuildPath = path.resolve(__dirname, '../../build');
app.use(express.static(clientBuildPath));
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  return res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
