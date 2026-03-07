const Return = require('../models/Return');
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const { getPagination } = require('../utils/pagination');

// Process a new itemized return
const processReturn = async (req, res, next) => {
    try {
        const { originalInvoiceNo, saleId, warehouseId, items, reason } = req.body;

        if (!originalInvoiceNo || !saleId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid return payload: Requires invoice, sale origin, and item list.' });
        }

        // Verify the original sale exists to extract platform context
        const originalSale = await Sale.findById(saleId);
        if (!originalSale) {
            return res.status(404).json({ success: false, message: 'Original sale record not found.' });
        }

        const platform = originalSale.source || 'MANUAL';

        // Generate isolated Return number
        const now = new Date();
        const returnNo = `RET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getTime()).slice(-6)}`;

        let totalReturnedItems = 0;
        let totalReturnedMeters = 0;
        let totalRefundAmount = 0;

        const validatedItems = items.map(line => {
            const qty = Number(line.qty || 0);
            const returnedAmount = Number(line.returnedAmount || 0);

            totalReturnedItems += 1;
            totalReturnedMeters += qty;
            totalRefundAmount += returnedAmount;

            return {
                itemId: line.itemId,
                barcode: line.barcode || '',
                itemName: line.itemName || '',
                code: line.code || '',
                qty,
                returnedAmount
            };
        });

        // Create the Return document independently
        const returnEntry = new Return({
            returnNo,
            originalInvoiceNo,
            saleId,
            platform,
            warehouseId: warehouseId || '',
            reason: reason || 'Sales Return',
            totalReturnedItems,
            totalReturnedMeters: Number(totalReturnedMeters.toFixed(2)),
            totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
            items: validatedItems,
            returnedAt: now
        });

        await returnEntry.save();

        // Restock the items in inventory based purely on the returned quantities
        for (const returnLine of validatedItems) {
            if (!returnLine.itemId || returnLine.qty <= 0) continue;

            // Increment stock contextually
            await Item.findByIdAndUpdate(
                returnLine.itemId,
                {
                    $inc: {
                        stock: returnLine.qty,
                        current_stock: returnLine.qty
                    }
                }
            );
        }

        // Do NOT mutate the original Sale record's quantities over here. The business requirement states:
        // "Order history should still show 100 purchased. Returns section should show 50 returned."

        res.status(201).json({
            success: true,
            data: returnEntry,
            message: 'Return processed successfully and inventory restocked.'
        });

    } catch (error) {
        next(error);
    }
};

// Fetch filtered returns
const getReturns = async (req, res, next) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const filter = {};
        const q = (req.query.search || req.query.q || '').trim();

        if (req.query.platform && req.query.platform !== 'ALL') {
            filter.platform = String(req.query.platform).toUpperCase();
        }

        if (req.query.warehouseId) {
            filter.warehouseId = String(req.query.warehouseId);
        }

        if (q) {
            const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { returnNo: regex },
                { originalInvoiceNo: regex },
                { 'items.itemName': regex },
                { 'items.barcode': regex }
            ];
        }

        const [returns, total] = await Promise.all([
            Return.find(filter).sort({ returnedAt: -1 }).skip(skip).limit(limit).lean(),
            Return.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: {
                returns,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    processReturn,
    getReturns
};
