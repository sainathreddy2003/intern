const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const expenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  category: {
    type: String,
    required: true,
    enum: ['Operating', 'Administrative', 'Salary', 'Marketing', 'Maintenance', 'Other']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'],
    default: 'Cash'
  },
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  receipt_number: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'APPROVED'],
    default: 'PENDING'
  },
  // Budget allocation fields
  budget_year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  budget_period: {
    type: String,
    required: true,
    enum: ['2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'],
    default: '2024-2025'
  },
  budget_category: {
    type: String,
    required: true,
    enum: ['Planned', 'Unplanned', 'Emergency', 'Recurring', 'One-time'],
    default: 'Planned'
  },
  budget_allocated: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  budget_remaining: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  budget_variance: {
    type: Number,
    default: 0
  },
  is_budget_exceeded: {
    type: Boolean,
    default: false
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate budget variance
expenseSchema.pre('save', function(next) {
  if (this.budget_allocated > 0) {
    this.budget_variance = this.amount - this.budget_allocated;
    this.budget_remaining = Math.max(0, this.budget_allocated - this.amount);
    this.is_budget_exceeded = this.amount > this.budget_allocated;
  }
  next();
});

// Index for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ created_by: 1 });
expenseSchema.index({ employee_id: 1 });
expenseSchema.index({ budget_year: 1 });
expenseSchema.index({ budget_period: 1 });
expenseSchema.index({ budget_category: 1 });
expenseSchema.index({ is_budget_exceeded: 1 });

module.exports = createTenantModel('Expense', expenseSchema);
