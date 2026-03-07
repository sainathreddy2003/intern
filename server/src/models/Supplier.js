const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const supplierSchema = new mongoose.Schema(
  {
    supplier_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    supplier_name: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    gst_no: {
      type: String,
      trim: true,
      default: ''
    },
    supplying_fabric: {
      type: String,
      trim: true,
      default: ''
    },
    supply_quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    is_active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.supplier_id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

supplierSchema.index({ supplier_name: 'text', supplier_code: 'text', mobile: 'text', supplying_fabric: 'text' });

module.exports = createTenantModel('Supplier', supplierSchema);
