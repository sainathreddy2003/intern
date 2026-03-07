const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const cashFlowSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['Inflow', 'Outflow']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Sales', 'Purchase', 'Expense', 'Salary Payment', 'Customer Collection', 'Supplier Payment', 'Loan', 'Investment', 'Other']
  },
  source: {
    type: String,
    enum: ['Sales', 'Purchase', 'Manual', 'Bank Transfer', 'Other'],
    default: 'Manual'
  },
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reference_type'
  },
  reference_type: {
    type: String,
    enum: ['Sale', 'Purchase', 'Expense', 'Employee', 'Customer', 'Supplier']
  },
  balance: {
    type: Number,
    default: 0
  },
  payment_method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Online', 'Other'],
    default: 'Cash'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  is_reconciled: {
    type: Boolean,
    default: false
  },
  reconciliation_date: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cashFlowSchema.index({ date: -1 });
cashFlowSchema.index({ type: 1 });
cashFlowSchema.index({ category: 1 });
cashFlowSchema.index({ created_by: 1 });
cashFlowSchema.index({ is_reconciled: 1 });

module.exports = createTenantModel('CashFlow', cashFlowSchema);
