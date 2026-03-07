const mongoose = require('mongoose');
const createTenantModel = require('./createTenantModel');

const returnedItemSchema = new mongoose.Schema(
    {
        itemId: { type: String, required: true },
        barcode: { type: String, default: '' },
        itemName: { type: String, default: '' },
        code: { type: String, default: '' },
        qty: { type: Number, required: true }, // The quantity returned for this specific item
        returnedAmount: { type: Number, default: 0 }, // The monetary value refunded for this item qty
    },
    { _id: false }
);

const returnSchema = new mongoose.Schema(
    {
        returnNo: { type: String, required: true, unique: true, index: true },
        originalInvoiceNo: { type: String, required: true, index: true },
        saleId: { type: String, required: true, index: true }, // Reference to the original Sale document
        platform: { type: String, default: 'MANUAL', index: true }, // Derived from original sale source (AMAZON, FLIPKART, etc.)
        warehouseId: { type: String, default: '', index: true }, // Optional: Which warehouse received this return?
        totalReturnedItems: { type: Number, default: 0 },
        totalReturnedMeters: { type: Number, default: 0 },
        totalRefundAmount: { type: Number, default: 0 },
        reason: { type: String, default: 'Sales Return' },
        returnedAt: { type: Date, default: Date.now, index: true },
        items: { type: [returnedItemSchema], default: [] }
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

returnSchema.index({ createdAt: -1 });
returnSchema.index({ platform: 1, warehouseId: 1 });

module.exports = createTenantModel('Return', returnSchema);
