const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const purchasePaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    mode: { type: String, default: 'CASH' },
    note: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const purchaseItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, default: '' },
    barcode: { type: String, default: '' },
    itemName: { type: String, default: '' },
    code: { type: String, default: '' },
    hsn_code: { type: String, default: '' },
    description: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    qty_meter: { type: Number, default: 0 },
    shrinkage: { type: Number, default: 0 },
    available_qty: { type: Number, default: 0 },
    unit_type: { type: String, default: 'meter' },
    piece_meter: { type: Number, default: 1 },
    roll_qty: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    cost_per_qty: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    tax_percent: { type: Number, default: 0 },
    tax_amount: { type: Number, default: 0 },
    discount_percent: { type: Number, default: 0 },
    discount_amount: { type: Number, default: 0 },
    net_cost: { type: Number, default: 0 },
    roi_percent: { type: Number, default: 0 },
    gross_profit_percent: { type: Number, default: 0 },
    selling_price: { type: Number, default: 0 },
    selling_price_per_piece: { type: Number, default: 0 },
    net_amount: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    purchase_no: { type: String, required: true, unique: true, index: true },
    purchase_date: { type: Date, default: Date.now },
    supplier_id: { type: String, default: '' },
    supplier_code: { type: String, default: '' },
    supplier_name: { type: String, required: true, default: '' },
    invoice_number: { type: String, default: '' },
    status: { type: String, default: 'ACTIVE', index: true },
    payment_mode: { type: String, default: 'CASH' },
    payment_status: { type: String, default: 'PAID', index: true },
    grand_total: { type: Number, default: 0 },
    paid_amount: { type: Number, default: 0 },
    due_amount: { type: Number, default: 0 },
    narration: { type: String, default: '' },
    items: { type: [purchaseItemSchema], default: [] },
    payments: { type: [purchasePaymentSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.purchase_id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

purchaseSchema.index({ createdAt: -1 });

module.exports = createTenantModel('Purchase', purchaseSchema);
