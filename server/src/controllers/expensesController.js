const Expense = require('../models/Expense');
const Employee = require('../models/Employee');

const CATEGORY_MAP = {
  RENT: 'Operating',
  UTILITIES: 'Operating',
  OFFICE_SUPPLIES: 'Administrative',
  SALARY: 'Salary',
  SALARIES: 'Salary',
  STAFF_PAY: 'Salary',
  WORKER_SALARY: 'Salary',
  MARKETING: 'Marketing',
  ADVERTISING: 'Marketing',
  MAINTENANCE: 'Maintenance',
  REPAIRS: 'Maintenance',
  TRANSPORTATION: 'Operating',
  TRAVEL: 'Operating',
  SOFTWARE: 'Administrative',
  IT: 'Administrative',
  OTHER: 'Other',
  Operating: 'Operating',
  Administrative: 'Administrative',
  Salary: 'Salary',
  Marketing: 'Marketing',
  Maintenance: 'Maintenance',
  Other: 'Other'
};

const PAYMENT_MODE_MAP = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT_CARD: 'Credit Card',
  CHECK: 'Check',
  OTHER: 'Other',
  Cash: 'Cash',
  'Bank Transfer': 'Bank Transfer',
  'Credit Card': 'Credit Card',
  Check: 'Check',
  Other: 'Other'
};

const toCanonicalExpensePayload = (payload = {}) => {
  const categoryRaw = payload.expense_category || payload.category || 'OTHER';
  const paymentRaw = payload.payment_mode || payload.payment_method || 'CASH';
  const statusRaw = String(payload.status || 'PENDING').toUpperCase();
  const normalizedStatus = ['PENDING', 'PAID', 'APPROVED'].includes(statusRaw) ? statusRaw : 'PENDING';
  const budgetCategoryRaw = payload.budget_category;
  const allowedBudgetCategories = ['Planned', 'Unplanned', 'Emergency', 'Recurring', 'One-time'];
  const normalizedBudgetCategory = allowedBudgetCategories.includes(budgetCategoryRaw)
    ? budgetCategoryRaw
    : 'Planned';

  return {
    ...payload,
    date: payload.expense_date || payload.date || payload.payment_date || new Date(),
    category: CATEGORY_MAP[categoryRaw] || 'Other',
    description: payload.expense_description || payload.description || '',
    payment_method: PAYMENT_MODE_MAP[paymentRaw] || 'Other',
    status: normalizedStatus,
    receipt_number: payload.reference_number || payload.receipt_number || undefined,
    budget_category: normalizedBudgetCategory,
    budget_allocated: Number(payload.budget_allocated || 0),
    budget_year: Number(payload.budget_year || new Date().getFullYear()),
    budget_period: payload.budget_period || '2024-2025',
  };
};

const serializeExpense = (expense) => {
  const id = expense._id?.toString?.() || expense.id;
  return {
    id,
    _id: id,
    date: expense.date,
    category: expense.category,
    description: expense.description,
    amount: Number(expense.amount || 0),
    payment_method: expense.payment_method,
    receipt_number: expense.receipt_number,
    notes: expense.notes,
    budget_year: expense.budget_year,
    budget_period: expense.budget_period,
    budget_category: expense.budget_category,
    budget_allocated: Number(expense.budget_allocated || 0),
    budget_remaining: Number(expense.budget_remaining || 0),
    budget_variance: Number(expense.budget_variance || 0),
    is_budget_exceeded: !!expense.is_budget_exceeded,
    status: expense.status || 'PENDING',
    expense_date: expense.date,
    expense_category: expense.category,
    expense_description: expense.description,
    payment_mode: expense.payment_method,
    reference_number: expense.receipt_number
  };
};

// Get all expenses
const getExpenses = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, fromDate, toDate, budgetYear, budgetPeriod, budgetCategory } = req.query;
    const filter = { is_active: true };

    if (category) filter.category = category;
    if (budgetYear) filter.budget_year = parseInt(budgetYear);
    if (budgetPeriod) filter.budget_period = budgetPeriod;
    if (budgetCategory) filter.budget_category = budgetCategory;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(`${fromDate}T00:00:00`);
      if (toDate) filter.date.$lte = new Date(`${toDate}T23:59:59`);
    }

    const expenses = await Expense.find(filter)
      .populate('employee_id', 'name employee_id')
      .populate('created_by', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(filter);

    res.json({
      success: true,
      data: {
        expenses: expenses.map(serializeExpense),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single expense
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employee_id', 'name employee_id')
      .populate('created_by', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      data: { expense }
    });
  } catch (error) {
    next(error);
  }
};

// Create expense
const createExpense = async (req, res, next) => {
  try {
    const normalized = toCanonicalExpensePayload(req.body);
    const expenseData = {
      ...normalized,
      created_by: req.user.id,
      budget_year: req.body.budget_year || new Date().getFullYear(),
      budget_period: req.body.budget_period || '2024-2025'
    };

    const expense = new Expense(expenseData);
    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('employee_id', 'name employee_id')
      .populate('created_by', 'name');

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: { expense: serializeExpense(populatedExpense) }
    });
  } catch (error) {
    next(error);
  }
};

// Update expense
const updateExpense = async (req, res, next) => {
  try {
    const normalized = toCanonicalExpensePayload(req.body);
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...normalized, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('employee_id', 'name employee_id')
      .populate('created_by', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: { expense: serializeExpense(expense) }
    });
  } catch (error) {
    next(error);
  }
};

// Delete expense (soft delete)
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get expense categories
const getExpenseCategories = async (req, res, next) => {
  try {
    const categories = await Expense.distinct('category');
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// Get budget analysis
const getBudgetAnalysis = async (req, res, next) => {
  try {
    const { budgetYear, budgetPeriod } = req.query;
    const filter = { is_active: true };

    if (budgetYear) filter.budget_year = parseInt(budgetYear);
    if (budgetPeriod) filter.budget_period = budgetPeriod;

    const expenses = await Expense.find(filter);

    // Calculate budget summary
    const budgetSummary = {
      total_allocated: expenses.reduce((sum, exp) => sum + (exp.budget_allocated || 0), 0),
      total_spent: expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      total_remaining: expenses.reduce((sum, exp) => sum + (exp.budget_remaining || 0), 0),
      total_variance: expenses.reduce((sum, exp) => sum + (exp.budget_variance || 0), 0),
      exceeded_count: expenses.filter(exp => exp.is_budget_exceeded).length,
      total_expenses: expenses.length
    };

    // Category-wise budget breakdown
    const categoryBreakdown = {};
    expenses.forEach(exp => {
      const category = exp.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          category,
          allocated: 0,
          spent: 0,
          remaining: 0,
          variance: 0,
          count: 0,
          exceeded_count: 0
        };
      }
      categoryBreakdown[category].allocated += exp.budget_allocated || 0;
      categoryBreakdown[category].spent += exp.amount || 0;
      categoryBreakdown[category].remaining += exp.budget_remaining || 0;
      categoryBreakdown[category].variance += exp.budget_variance || 0;
      categoryBreakdown[category].count += 1;
      if (exp.is_budget_exceeded) categoryBreakdown[category].exceeded_count += 1;
    });

    // Budget category breakdown
    const budgetCategoryBreakdown = {};
    expenses.forEach(exp => {
      const budgetCat = exp.budget_category;
      if (!budgetCategoryBreakdown[budgetCat]) {
        budgetCategoryBreakdown[budgetCat] = {
          budget_category: budgetCat,
          allocated: 0,
          spent: 0,
          remaining: 0,
          variance: 0,
          count: 0
        };
      }
      budgetCategoryBreakdown[budgetCat].allocated += exp.budget_allocated || 0;
      budgetCategoryBreakdown[budgetCat].spent += exp.amount || 0;
      budgetCategoryBreakdown[budgetCat].remaining += exp.budget_remaining || 0;
      budgetCategoryBreakdown[budgetCat].variance += exp.budget_variance || 0;
      budgetCategoryBreakdown[budgetCat].count += 1;
    });

    res.json({
      success: true,
      data: {
        summary: budgetSummary,
        category_breakdown: Object.values(categoryBreakdown),
        budget_category_breakdown: Object.values(budgetCategoryBreakdown),
        budget_year: budgetYear || new Date().getFullYear(),
        budget_period: budgetPeriod || '2024-2025'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get budget periods
const getBudgetPeriods = async (req, res, next) => {
  try {
    const periods = await Expense.distinct('budget_period');
    const years = await Expense.distinct('budget_year');

    res.json({
      success: true,
      data: {
        periods: periods.sort(),
        years: years.sort()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update budget allocation
const updateBudgetAllocation = async (req, res, next) => {
  try {
    const { budgetAllocations } = req.body; // Array of { id, budget_allocated }

    const updatePromises = budgetAllocations.map(async ({ id, budget_allocated }) => {
      const expense = await Expense.findById(id);
      if (expense) {
        expense.budget_allocated = budget_allocated;
        expense.budget_variance = expense.amount - budget_allocated;
        expense.budget_remaining = Math.max(0, budget_allocated - expense.amount);
        expense.is_budget_exceeded = expense.amount > budget_allocated;
        await expense.save();
        return expense;
      }
      return null;
    });

    const updatedExpenses = await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Budget allocations updated successfully',
      data: { expenses: updatedExpenses.filter(e => e !== null) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getBudgetAnalysis,
  getBudgetPeriods,
  updateBudgetAllocation
};
