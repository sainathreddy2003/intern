const express = require('express');
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/reportsController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryReport);
router.get('/tax', getTaxReport);
router.get('/customers', getCustomerReport);
router.get('/suppliers', getSupplierReport);
router.get('/day-end', getDayEndReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/expenses', getExpenseReport);
router.get('/salary', getSalaryReport);
router.get('/cash-flow', getCashFlowReport);
router.get('/employees', getEmployeeReport);
router.get('/export/:reportType', exportReport);

module.exports = router;
