const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const saleItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    barcode: { type: String, default: '' },
    code: { type: String, default: '' },
    name: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    rate: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    taxPct: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    servicePct: { type: Number, default: 0 },
    serviceAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  { _id: false }
);

const salePaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    mode: { type: String, default: 'CASH' },
    note: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    // Backward-compatible field for existing Mongo index bill_no_1
    bill_no: { type: String, default: '' },
    invoiceNo: { type: String, required: true, index: true },
    referenceInvoiceNo: { type: String, default: '' },
    customerId: { type: String, default: '' },
    customerName: { type: String, default: 'Direct Fabric Sale' },
    customerCode: { type: String, default: '' },
    customerMobile: { type: String, default: '' },
    customerAddress: { type: String, default: '' },
    billDate: { type: String, default: '' },
    paymentMode: { type: String, default: 'CASH' },
    paymentStatus: { type: String, default: 'COMPLETED' },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    source: { type: String, default: 'MANUAL', index: true },
    billType: { type: String, default: 'SALES', index: true },
    reason: { type: String, default: '' },
    totalItems: { type: Number, default: 0 },
    totalMeters: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    grossAmount: { type: Number, default: 0 },
    lineDiscountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    serviceChargeAmount: { type: Number, default: 0 },
    freightAmount: { type: Number, default: 0 },
    packingCharge: { type: Number, default: 0 },
    otherCharge: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    billDiscountPct: { type: Number, default: 0 },
    billDiscount: { type: Number, default: 0 },
    isHold: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
    items: { type: [saleItemSchema], default: [] },
    payments: { type: [salePaymentSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      }
    }
  }
);

saleSchema.index({ createdAt: -1 });
saleSchema.index({ paymentStatus: 1, source: 1, billType: 1 });

saleSchema.pre('validate', function preValidate(next) {
  if (!this.bill_no && this.invoiceNo) {
    this.bill_no = this.invoiceNo;
  }
  if (!this.invoiceNo && this.bill_no) {
    this.invoiceNo = this.bill_no;
  }
  next();
});

module.exports = createTenantModel('Sale', saleSchema);
