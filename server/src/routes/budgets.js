const express = require('express');
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetPeriods,
  createBudgetPeriod,
  updateBudgetPeriod,
  deleteBudgetPeriod
} = require('../controllers/budgetController');

const router = express.Router();

router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

router.get('/periods', getBudgetPeriods);
router.post('/periods', createBudgetPeriod);
router.put('/periods/:id', updateBudgetPeriod);
router.delete('/periods/:id', deleteBudgetPeriod);

module.exports = router;
