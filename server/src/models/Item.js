const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const itemSchema = new mongoose.Schema(
  {
    item_name: {
      type: String,
      required: true,
      trim: true
    },
    barcode: {
      type: String,
      trim: true,
      default: ''
    },
    group: {
      type: String,
      trim: true,
      default: 'General'
    },
    group_id: {
      type: String,
      trim: true,
      default: ''
    },
    item_type: {
      type: String,
      trim: true,
      uppercase: true,
      enum: ['GENERAL', 'FABRIC', 'PRODUCT', 'OTHER'],
      default: 'GENERAL'
    },
    custom_product_name: {
      type: String,
      trim: true,
      default: ''
    },
    fabric_type: {
      type: String,
      trim: true,
      default: ''
    },
    color: {
      type: String,
      trim: true,
      default: ''
    },
    design: {
      type: String,
      trim: true,
      default: ''
    },
    width_inch: {
      type: Number,
      default: 0
    },
    gsm: {
      type: Number,
      default: 0
    },
    roll_length: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      trim: true,
      default: 'Nos'
    },
    unit_name: {
      type: String,
      trim: true,
      default: '1'
    },
    tax: {
      type: Number,
      default: 0
    },
    tax_percentage: {
      type: Number,
      default: 0
    },
    tax_amount: {
      type: Number,
      default: 0
    },
    sale_price: {
      type: Number,
      default: 0
    },
    selling_price: {
      type: Number,
      default: 0
    },
    selling_price_per_piece: {
      type: Number,
      default: 0
    },
    purchase_price: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      default: 0
    },
    cost_per_qty: {
      type: Number,
      default: 0
    },
    discount_percent: {
      type: Number,
      default: 0
    },
    discount_amount: {
      type: Number,
      default: 0
    },
    net_cost: {
      type: Number,
      default: 0
    },
    net_amount: {
      type: Number,
      default: 0
    },
    roi_percent: {
      type: Number,
      default: 0
    },
    gross_profit_percent: {
      type: Number,
      default: 0
    },
    piece_meter: {
      type: Number,
      default: 0
    },
    hsn_code: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    stock: {
      type: Number,
      default: 0
    },
    current_stock: {
      type: Number,
      default: 0
    },
    min_stock_level: {
      type: Number,
      default: 0
    },
    last_purchase_id: {
      type: String,
      trim: true,
      default: ''
    },
    last_purchase_no: {
      type: String,
      trim: true,
      default: ''
    },
    last_purchase_date: {
      type: String,
      trim: true,
      default: ''
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
        ret.item_id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

itemSchema.index({ item_name: 'text', barcode: 'text', group: 'text' });

module.exports = createTenantModel('Item', itemSchema);
