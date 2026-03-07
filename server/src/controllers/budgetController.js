const Budget = require('../models/Budget');
const BudgetPeriod = require('../models/BudgetPeriod');

const getCurrentBudgetPeriod = () => {
  const year = new Date().getFullYear();
  return `${year}-${year + 1}`;
};

const normalizeBudgetPayload = (payload = {}) => {
  const normalized = { ...payload };
  const allocated = payload.allocated_amount ?? payload.budget;
  const spent = payload.spent_amount ?? payload.spent ?? 0;

  if (allocated !== undefined) normalized.allocated_amount = Number(allocated);
  if (spent !== undefined) normalized.spent_amount = Number(spent);

  normalized.budget_year = Number(payload.budget_year || new Date().getFullYear());
  normalized.budget_period = payload.budget_period || getCurrentBudgetPeriod();

  if (typeof payload.category === 'string') {
    normalized.category = payload.category.trim();
  }

  delete normalized.budget;
  delete normalized.id;
  return normalized;
};

// Get all budgets
const getBudgets = async (req, res, next) => {
  try {
    const { budget_year, budget_period } = req.query;
    const filter = {};
    
    if (budget_year) filter.budget_year = parseInt(budget_year);
    if (budget_period) filter.budget_period = budget_period;

    const budgets = await Budget.find(filter).sort({ created_at: -1 });

    res.json({
      success: true,
      data: budgets
    });
  } catch (error) {
    next(error);
  }
};

// Create budget
const createBudget = async (req, res, next) => {
  try {
    const payload = normalizeBudgetPayload(req.body);
    const query = {
      budget_year: payload.budget_year,
      budget_period: payload.budget_period,
      category: payload.category
    };

    const budget = await Budget.findOneAndUpdate(
      query,
      { ...payload, updated_at: new Date() },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      success: true,
      message: 'Budget saved successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// Update budget
const updateBudget = async (req, res, next) => {
  try {
    const payload = normalizeBudgetPayload(req.body);
    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { ...payload, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

// Delete budget
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get budget periods
const getBudgetPeriods = async (req, res, next) => {
  try {
    const periods = await BudgetPeriod.find().sort({ created_at: -1 });

    res.json({
      success: true,
      data: { periods }
    });
  } catch (error) {
    next(error);
  }
};

// Create budget period
const createBudgetPeriod = async (req, res, next) => {
  try {
    const period = new BudgetPeriod(req.body);
    await period.save();

    res.status(201).json({
      success: true,
      message: 'Budget period created successfully',
      data: { period }
    });
  } catch (error) {
    next(error);
  }
};

// Update budget period
const updateBudgetPeriod = async (req, res, next) => {
  try {
    const period = await BudgetPeriod.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Budget period not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget period updated successfully',
      data: { period }
    });
  } catch (error) {
    next(error);
  }
};

// Delete budget period
const deleteBudgetPeriod = async (req, res, next) => {
  try {
    const period = await BudgetPeriod.findByIdAndDelete(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Budget period not found'
      });
    }

    res.json({
      success: true,
      message: 'Budget period deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetPeriods,
  createBudgetPeriod,
  updateBudgetPeriod,
  deleteBudgetPeriod
};
