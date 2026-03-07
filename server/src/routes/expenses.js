const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getBudgetAnalysis,
  getBudgetPeriods,
  updateBudgetAllocation
} = require('../controllers/expensesController');

const router = express.Router();
router.use(protect);

router.get('/', getExpenses);
router.get('/categories', getExpenseCategories);
router.get('/budget-analysis', getBudgetAnalysis);
router.get('/budget-periods', getBudgetPeriods);
router.put('/budget-allocation', updateBudgetAllocation);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
