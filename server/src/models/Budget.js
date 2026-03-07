const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const budgetSchema = new mongoose.Schema({
  budget_year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  budget_period: {
    type: String,
    required: true,
    enum: ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'ANNUAL', '2024-2025', '2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  allocated_amount: {
    type: Number,
    required: true,
    min: 0
  },
  spent_amount: {
    type: Number,
    default: 0,
    min: 0
  },
  remaining_amount: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

budgetSchema.pre('save', function(next) {
  this.remaining_amount = this.allocated_amount - this.spent_amount;
  next();
});

budgetSchema.index({ budget_year: 1, budget_period: 1, category: 1 }, { unique: true });

module.exports = createTenantModel('Budget', budgetSchema);
