const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');
const Return = require('../models/Return');
const { getPagination } = require('../utils/pagination');

const listWarehouses = async (req, res, next) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const filter = {};
        const q = (req.query.search || req.query.q || '').trim();

        if (req.query.status) {
            filter.status = String(req.query.status).toUpperCase();
        }

        if (q) {
            const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [
                { name: regex },
                { code: regex },
                { location: regex }
            ];
        }

        const [warehouses, total] = await Promise.all([
            Warehouse.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
            Warehouse.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: warehouses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

const createWarehouse = async (req, res, next) => {
    try {
        const payload = req.body || {};

        if (!payload.name) {
            res.status(400);
            throw new Error('Warehouse name is required');
        }

        if (!payload.code) {
            // Auto generate code if not provided
            payload.code = `WH-${Date.now().toString(36).toUpperCase()}`;
        }

        const exists = await Warehouse.findOne({ code: payload.code.toUpperCase() });
        if (exists) {
            res.status(400);
            throw new Error('Warehouse code already exists');
        }

        const created = await Warehouse.create(payload);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        if (error?.code === 11000) {
            res.status(400).json({ success: false, message: 'Duplicate warehouse code' });
            return;
        }
        next(error);
    }
};

const getWarehouse = async (req, res, next) => {
    try {
        const row = await Warehouse.findById(req.params.id);
        if (!row) {
            res.status(404);
            throw new Error('Warehouse not found');
        }
        res.json({ success: true, data: row });
    } catch (error) {
        next(error);
    }
};

const updateWarehouse = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        const updated = await Warehouse.findByIdAndUpdate(req.params.id, payload, {
            new: true,
            runValidators: true
        });

        if (!updated) {
            res.status(404);
            throw new Error('Warehouse not found');
        }
        res.json({ success: true, data: updated });
    } catch (error) {
        if (error?.code === 11000) {
            res.status(400).json({ success: false, message: 'Duplicate warehouse code' });
            return;
        }
        next(error);
    }
};

const deleteWarehouse = async (req, res, next) => {
    try {
        const deleted = await Warehouse.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404);
            throw new Error('Warehouse not found');
        }
        res.json({ success: true, message: 'Warehouse deleted', data: { id: req.params.id } });
    } catch (error) {
        next(error);
    }
};

const addManualEntry = async (req, res, next) => {
    try {
        const { warehouseId, productName, platform, sku, qty, costPrice, sellingPrice, notes, entryDate } = req.body;

        if (!warehouseId || !productName || !sku || qty === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields for manual entry' });
        }

        const numericQty = Number(qty);
        if (isNaN(numericQty) || numericQty <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
        }

        // 1. Upsert Item
        let item = await Item.findOne({
            $or: [
                { item_code: sku.toUpperCase() },
                { barcode: sku.toUpperCase() }
            ]
        });

        if (item) {
            item.stock = (item.stock || 0) + numericQty;
            item.current_stock = item.stock;
            // Optionally update prices if provided and greater than 0
            if (Number(costPrice) > 0) item.purchase_price = Number(costPrice);
            if (Number(sellingPrice) > 0) item.selling_price = Number(sellingPrice);
            await item.save();
        } else {
            // Create new item
            item = await Item.create({
                item_code: sku.toUpperCase(),
                item_name: productName,
                barcode: sku.toUpperCase(),
                stock: numericQty,
                current_stock: numericQty,
                purchase_price: Number(costPrice) || 0,
                selling_price: Number(sellingPrice) || 0,
                item_type: 'GENERAL'
            });
        }

        // 2. Create Return Document to track incoming stock dynamically in Warehouse
        const now = new Date();
        const returnNo = `MAN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getTime()).slice(-6)}`;

        const returnEntry = await Return.create({
            returnNo,
            originalInvoiceNo: 'MANUAL-ENTRY',
            saleId: 'MANUAL',
            platform: platform || 'MANUAL',
            warehouseId,
            reason: notes || 'Manual Warehouse Entry',
            totalReturnedItems: 1,
            totalReturnedMeters: numericQty,
            totalRefundAmount: 0,
            items: [{
                itemId: item._id,
                barcode: item.barcode || '',
                itemName: item.item_name || '',
                code: item.item_code || '',
                qty: numericQty,
                returnedAmount: 0
            }],
            returnedAt: entryDate ? new Date(entryDate) : now
        });

        res.status(201).json({
            success: true,
            message: 'Manual entry added successfully',
            data: { item, returnEntry }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listWarehouses,
    createWarehouse,
    getWarehouse,
    updateWarehouse,
    deleteWarehouse,
    addManualEntry
};
