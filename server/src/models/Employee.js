const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  employee_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Sales', 'Purchase', 'Inventory', 'HR', 'Finance', 'IT', 'Marketing', 'General'],
    default: 'General'
  },
  position: {
    type: String,
    trim: true
  },
  salary: {
    type: Number,
    required: true,
    min: 0
  },
  hire_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zip: { type: String, trim: true },
    country: { type: String, trim: true, default: 'India' }
  },
  emergency_contact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  bank_details: {
    bank_name: { type: String, trim: true },
    account_number: { type: String, trim: true },
    ifsc_code: { type: String, trim: true },
    branch: { type: String, trim: true }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ hire_date: -1 });

module.exports = createTenantModel('Employee', employeeSchema);
