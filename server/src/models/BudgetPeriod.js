const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const budgetPeriodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = createTenantModel('BudgetPeriod', budgetPeriodSchema);
