const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const systemSettingSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: 'SYSTEM',
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    business_name: { type: String, default: 'Ramesh Exports' },
    business_phone: { type: String, default: '' },
    business_email: { type: String, default: '' },
    business_address: { type: String, default: '' },
    gst_no: { type: String, default: '' },
    currency_symbol: { type: String, default: '₹' },
    invoice_prefix: { type: String, default: 'INV' },
    purchase_prefix: { type: String, default: 'PO' },
    default_sales_source: { type: String, default: 'MANUAL' },
    default_payment_mode: { type: String, default: 'CASH' },
    auto_sync: { type: Boolean, default: true },
    sync_interval_minutes: { type: Number, default: 30 },
    last_sync_at: { type: Date, default: null },
    backup_enabled: { type: Boolean, default: false },
    printer_name: { type: String, default: '' },
    language: { type: String, default: 'en' },
    notifications_enabled: { type: Boolean, default: true },
    max_login_attempts: { type: Number, default: 5 },
    lockout_duration: { type: Number, default: 30 },
    force_password_change: { type: Boolean, default: false },
    password_min_length: { type: Number, default: 8 },
    password_require_uppercase: { type: Boolean, default: true },
    password_require_lowercase: { type: Boolean, default: true },
    password_require_numbers: { type: Boolean, default: true },
    password_require_special: { type: Boolean, default: false },
    session_timeout: { type: Number, default: 60 },
    two_factor_auth: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

module.exports = createTenantModel('SystemSetting', systemSettingSchema);
