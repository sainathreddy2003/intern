const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Item = require('../models/Item');
const { getPagination } = require('../utils/pagination');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs/promises');

const removeUploadedAttachmentIfExists = async (attachmentPath = '') => {
  const normalized = String(attachmentPath || '').trim();
  if (!normalized) return;
  const absolutePath = path.resolve(__dirname, '../..', normalized);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Failed to remove purchase attachment ${absolutePath}: ${error.message}`);
    }
  }
};

const findPurchaseByIdOrNo = async (identifier = '') => {
  const value = String(identifier || '').trim();
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) {
    const byId = await Purchase.findById(value);
    if (byId) return byId;
  }
  return Purchase.findOne({ purchase_no: value });
};

const normalizePurchasePayment = (row) => {
  const total = Math.max(0, Number(row.grand_total || 0));
  const paid = Math.min(total, Math.max(0, Number(row.paid_amount || 0)));
  const due = Math.max(Number((total - paid).toFixed(2)), 0);
  let paymentStatus = 'PAID';
  if (due >= total && total > 0) paymentStatus = 'PENDING';
  else if (due > 0) paymentStatus = 'PARTIAL';
  row.paid_amount = Number(paid.toFixed(2));
  row.due_amount = Number(due.toFixed(2));
  row.payment_status = paymentStatus;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCode = (value = '') =>
  String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');

const resolveUniqueItemCode = async (preferred = '') => {
  const base = normalizeCode(preferred) || `ITM-${Date.now().toString(36).toUpperCase()}`;
  let candidate = base;
  let suffix = 1;
  while (await Item.exists({ item_code: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const getLineQty = (line = {}) => {
  if (line.available_qty !== undefined && line.available_qty !== null && line.available_qty !== '') {
    const availableQty = Math.max(0, toNumber(line.available_qty));
    if (availableQty > 0) return availableQty;
  }
  const qtyMeter = Math.max(0, toNumber(line.qty_meter));
  if (qtyMeter > 0) return qtyMeter;
  return Math.max(0, toNumber(line.qty));
};

const resolveItemForLine = async (line = {}) => {
  const itemId = String(line.itemId || line.item_id || '').trim();
  const code = String(line.code || line.item_code || '').trim().toUpperCase();
  const barcode = String(line.barcode || '').trim();

  if (itemId && mongoose.Types.ObjectId.isValid(itemId)) {
    const byId = await Item.findById(itemId);
    if (byId) return byId;
  }
  if (code) {
    const byCode = await Item.findOne({ item_code: code });
    if (byCode) return byCode;
  }
  if (barcode) {
    const byBarcode = await Item.findOne({ barcode });
    if (byBarcode) return byBarcode;
  }

  // Auto-create new item from purchase row so it appears in Items immediately.
  const itemName = String(line.itemName || line.description || code || barcode || 'New Item').trim();
  const itemCode = await resolveUniqueItemCode(code || barcode || itemName.slice(0, 12));
  const purchasePrice = Math.max(0, toNumber(line.cost_per_qty || line.cost));
  const salePrice = Math.max(0, toNumber(line.selling_price || line.mrp));
  const tax = Math.max(0, toNumber(line.tax_percent || 0));
  const itemType = String(line.item_type || line.itemType || 'FABRIC').trim().toUpperCase();
  const unitType = String(line.unit_type || '').toLowerCase();
  const unit =
    itemType === 'PRODUCT' || itemType === 'OTHER'
      ? 'PCS'
      : unitType === 'roll'
        ? 'ROLL'
        : 'MTR';
  const unitName = itemType === 'PRODUCT' || itemType === 'OTHER' ? 'Piece' : 'Meter';
  const pieceMeter = Math.max(0, toNumber(line.piece_meter || 1));

  return Item.create({
    item_code: itemCode,
    item_name: itemName,
    barcode,
    color: String(line.color || '').trim(),
    hsn_code: String(line.hsn_code || '').trim(),
    description: String(line.description || itemName).trim(),
    item_type: itemType,
    custom_product_name: String(line.custom_product_name || '').trim(),
    unit,
    unit_name: unitName,
    piece_meter: pieceMeter,
    purchase_price: purchasePrice,
    cost_per_qty: purchasePrice,
    sale_price: salePrice,
    selling_price: salePrice,
    tax,
    tax_percentage: tax,
    stock: 0,
    current_stock: 0,
    min_stock_level: 0,
    is_active: true
  });
};

const applyPurchaseItemsToStock = async (items = [], direction = 1, purchaseMeta = {}) => {
  if (!Array.isArray(items) || items.length === 0) return;

  const merged = new Map();

  for (const line of items) {
    const qty = getLineQty(line);
    if (qty <= 0) continue;

    const item = await resolveItemForLine(line);
    if (!item) continue;

    const key = item._id.toString();
    const prev = merged.get(key) || { item, qtyDelta: 0, latestLine: null };
    prev.qtyDelta += direction * qty;
    prev.latestLine = line;
    merged.set(key, prev);
  }

  for (const { item, qtyDelta, latestLine } of merged.values()) {
    const baseStock = toNumber(item.current_stock ?? item.stock);
    const nextStock = Math.max(0, baseStock + qtyDelta);
    item.current_stock = nextStock;
    item.stock = nextStock;

    if (direction > 0 && latestLine) {
      const purchasePrice = Math.max(0, toNumber(latestLine.cost_per_qty || latestLine.cost));
      const salePrice = Math.max(0, toNumber(latestLine.selling_price || latestLine.mrp));
      if (purchasePrice > 0) {
        item.purchase_price = purchasePrice;
        item.cost_per_qty = purchasePrice;
      }
      if (salePrice > 0) {
        item.sale_price = salePrice;
      }
      if (String(latestLine.color || '').trim()) {
        item.color = String(latestLine.color || '').trim();
      }
      item.last_purchase_id = String(purchaseMeta.id || '');
      item.last_purchase_no = String(purchaseMeta.purchase_no || '');
      item.last_purchase_date = purchaseMeta.purchase_date
        ? new Date(purchaseMeta.purchase_date).toISOString()
        : new Date().toISOString();
    }

    await item.save();
  }
};

const listPurchases = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const q = (req.query.search || req.query.q || '').trim();

    if (req.query.supplierId) filter.supplier_id = String(req.query.supplierId);
    if (req.query.status) filter.status = String(req.query.status).toUpperCase();
    if (req.query.paymentStatus) filter.payment_status = String(req.query.paymentStatus).toUpperCase();

    if (req.query.fromDate || req.query.toDate) {
      filter.purchase_date = {};
      if (req.query.fromDate) filter.purchase_date.$gte = new Date(`${req.query.fromDate}T00:00:00`);
      if (req.query.toDate) filter.purchase_date.$lte = new Date(`${req.query.toDate}T23:59:59`);
    }

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { purchase_no: regex },
        { invoice_number: regex },
        { supplier_name: regex },
        { supplier_code: regex }
      ];
    }

    const [orders, total] = await Promise.all([
      Purchase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Purchase.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const payload = { ...(req.body || {}) };
    const removeAttachmentRequested =
      String(payload.remove_bill_attachment || '').toLowerCase() === 'true' ||
      String(payload.remove_bill_attachment || '') === '1';
    delete payload.remove_bill_attachment;
    if (typeof payload.items === 'string') {
      try {
        payload.items = JSON.parse(payload.items);
      } catch (_error) {
        res.status(400);
        throw new Error('Invalid items payload format');
      }
    }
    if (!Array.isArray(payload.items)) {
      payload.items = [];
    }

    const previousAttachmentPath = String(existing.bill_attachment || '').trim();
    let shouldRemovePreviousAttachment = false;

    if (req.file?.path) {
      payload.bill_attachment = path
        .relative(path.resolve(__dirname, '../..'), req.file.path)
        .split(path.sep)
        .join('/');
      shouldRemovePreviousAttachment = Boolean(previousAttachmentPath);
    } else if (removeAttachmentRequested) {
      payload.bill_attachment = '';
      shouldRemovePreviousAttachment = Boolean(previousAttachmentPath);
    }

    const now = new Date();
    payload.purchase_no =
      payload.purchase_no ||
      `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getTime()).slice(-6)}`;

    const total = Math.max(0, Number(payload.grand_total || 0));
    const paid = Math.max(0, Number(payload.paid_amount ?? 0));
    payload.payment_mode = String(payload.payment_mode || 'CASH').toUpperCase();
    payload.status = String(payload.status || 'ACTIVE').toUpperCase();

    if (payload.payment_mode === 'CREDIT' && (payload.paid_amount === undefined || payload.paid_amount === null)) {
      payload.paid_amount = 0;
    } else if (payload.payment_mode !== 'CREDIT' && (payload.paid_amount === undefined || payload.paid_amount === null)) {
      payload.paid_amount = total;
    } else {
      payload.paid_amount = paid;
    }

    normalizePurchasePayment(payload);
    const created = await Purchase.create(payload);
    await applyPurchaseItemsToStock(created.items, 1, {
      id: created._id,
      purchase_no: created.purchase_no,
      purchase_date: created.purchase_date
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400).json({ success: false, message: 'Duplicate purchase number' });
      return;
    }
    next(error);
  }
};

const listActiveSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ is_active: true }).sort({ supplier_name: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

const getPurchase = async (req, res, next) => {
  try {
    const row = await findPurchaseByIdOrNo(req.params.id);
    if (!row) {
      res.status(404);
      throw new Error('Purchase order not found');
    }
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const updatePurchase = async (req, res, next) => {
  try {
    const existing = await findPurchaseByIdOrNo(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Purchase order not found');
    }

    const payload = { ...(req.body || {}) };
    const removeAttachmentRequested =
      String(payload.remove_bill_attachment || '').toLowerCase() === 'true' ||
      String(payload.remove_bill_attachment || '') === '1';
    delete payload.remove_bill_attachment;
    if (typeof payload.items === 'string') {
      try {
        payload.items = JSON.parse(payload.items);
      } catch (_error) {
        res.status(400);
        throw new Error('Invalid items payload format');
      }
    }
    const previousAttachmentPath = String(existing.bill_attachment || '').trim();
    let shouldRemovePreviousAttachment = false;
    if (req.file?.path) {
      payload.bill_attachment = path
        .relative(path.resolve(__dirname, '../..'), req.file.path)
        .split(path.sep)
        .join('/');
      shouldRemovePreviousAttachment = Boolean(previousAttachmentPath);
    } else if (removeAttachmentRequested) {
      payload.bill_attachment = '';
      shouldRemovePreviousAttachment = Boolean(previousAttachmentPath);
    }
    if (payload.grand_total !== undefined || payload.paid_amount !== undefined) {
      const merged = {
        grand_total: payload.grand_total !== undefined ? payload.grand_total : existing.grand_total,
        paid_amount: payload.paid_amount !== undefined ? payload.paid_amount : existing.paid_amount
      };
      normalizePurchasePayment(merged);
      payload.paid_amount = merged.paid_amount;
      payload.due_amount = merged.due_amount;
      payload.payment_status = merged.payment_status;
    }

    const updated = await Purchase.findByIdAndUpdate(existing._id, payload, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      res.status(404);
      throw new Error('Purchase order not found');
    }

    // Reconcile stock with old vs new purchase lines
    await applyPurchaseItemsToStock(existing.items, -1, {
      id: existing._id,
      purchase_no: existing.purchase_no,
      purchase_date: existing.purchase_date
    });
    await applyPurchaseItemsToStock(updated.items, 1, {
      id: updated._id,
      purchase_no: updated.purchase_no,
      purchase_date: updated.purchase_date
    });

    if (shouldRemovePreviousAttachment) {
      await removeUploadedAttachmentIfExists(previousAttachmentPath);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const addPurchasePayment = async (req, res, next) => {
  try {
    const amount = Math.max(0, Number(req.body.amount || 0));
    if (amount <= 0) {
      res.status(400);
      throw new Error('Payment amount must be greater than 0');
    }
    const row = await findPurchaseByIdOrNo(req.params.id);
    if (!row) {
      res.status(404);
      throw new Error('Purchase order not found');
    }

    row.payments.push({
      amount,
      mode: String(req.body.mode || 'CASH').toUpperCase(),
      note: String(req.body.note || '').trim(),
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date()
    });
    row.paid_amount = Number(row.paid_amount || 0) + amount;
    normalizePurchasePayment(row);

    await row.save();
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const deletePurchase = async (req, res, next) => {
  try {
    const existing = await findPurchaseByIdOrNo(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error('Purchase order not found');
    }
    const deleted = await Purchase.findByIdAndDelete(existing._id);
    if (!deleted) {
      res.status(404);
      throw new Error('Purchase order not found');
    }
    await applyPurchaseItemsToStock(deleted.items, -1, {
      id: deleted._id,
      purchase_no: deleted.purchase_no,
      purchase_date: deleted.purchase_date
    });
    res.json({ success: true, message: 'Purchase order deleted', data: { id: String(existing._id) } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listPurchases,
  createPurchase,
  listActiveSuppliers,
  getPurchase,
  updatePurchase,
  addPurchasePayment,
  deletePurchase
};
