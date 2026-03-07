const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const payrollSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  payment_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  payment_month: {
    type: String,
    required: true
  },
  payment_year: {
    type: Number,
    required: true
  },
  basic_salary: {
    type: Number,
    required: true,
    min: 0
  },
  allowances: {
    type: Number,
    default: 0,
    min: 0
  },
  deductions: {
    type: Number,
    default: 0,
    min: 0
  },
  net_salary: {
    type: Number,
    required: true,
    min: 0
  },
  payment_method: {
    type: String,
    enum: ['CASH', 'BANK TRANSFER', 'CHEQUE'],
    default: 'BANK TRANSFER'
  },
  payment_status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  transaction_reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

payrollSchema.pre('save', function(next) {
  this.net_salary = this.basic_salary + this.allowances - this.deductions;
  next();
});

payrollSchema.index({ employee_id: 1, payment_month: 1, payment_year: 1 }, { unique: true });
payrollSchema.index({ payment_date: -1 });

module.exports = createTenantModel('Payroll', payrollSchema);
