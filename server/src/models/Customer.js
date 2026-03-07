const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const customerSchema = new mongoose.Schema(
  {
    customer_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    customer_name: {
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
    credit_limit: {
      type: Number,
      default: 0
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
        ret.customer_id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

customerSchema.index({ customer_name: 'text', customer_code: 'text', mobile: 'text' });

module.exports = createTenantModel('Customer', customerSchema);
