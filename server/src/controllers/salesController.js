const Sale = require('../models/Sale');
const { getPagination } = require('../utils/pagination');

const ALLOWED_SALE_SOURCES = ['DOMESTIC', 'OTHERS', 'WEBSITE', 'AMAZON', 'FLIPKART', 'MEESHO'];

const normalizeSaleSource = (payload = {}, strict = false) => {
  const raw = String(payload.source || '').trim().toUpperCase();
  if (!raw) {
    payload.source = 'DOMESTIC';
    return;
  }

  if (raw === 'MANUAL') {
    payload.source = 'DOMESTIC';
    return;
  }

  if (!ALLOWED_SALE_SOURCES.includes(raw)) {
    if (strict) {
      throw new Error(`Invalid sale source. Allowed values: ${ALLOWED_SALE_SOURCES.join(', ')}`);
    }
    payload.source = 'DOMESTIC';
    return;
  }
  payload.source = raw;
};

const normalizeSalePayment = (payload = {}) => {
  const net = Math.abs(Number(payload.netAmount || 0));
  const mode = String(payload.paymentMode || 'CASH').toUpperCase();
  let paid = Number(payload.paidAmount);
  if (!Number.isFinite(paid)) {
    paid = mode === 'CREDIT' ? 0 : net;
  }
  paid = Math.max(0, Math.min(net, paid));
  const due = Math.max(Number((net - paid).toFixed(2)), 0);

  let status = String(payload.paymentStatus || '').toUpperCase();
  if (!status) {
    if (due === 0) status = 'COMPLETED';
    else if (paid > 0) status = 'PARTIAL';
    else status = 'PENDING';
  }

  payload.paymentMode = mode;
  payload.paidAmount = Number(paid.toFixed(2));
  payload.dueAmount = due;
  payload.paymentStatus = status;
};

const listSales = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};

    if (req.query.billType) filter.billType = String(req.query.billType).toUpperCase();
    if (req.query.source) filter.source = String(req.query.source).toUpperCase();
    if (req.query.paymentStatus) filter.paymentStatus = String(req.query.paymentStatus).toUpperCase();

    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(`${req.query.dateFrom}T00:00:00`);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(`${req.query.dateTo}T23:59:59`);
    }

    const [rows, total] = await Promise.all([
      Sale.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Sale.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items: rows,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

const createSale = async (req, res, next) => {
  try {
    const payload = req.body || {};
    payload.invoiceNo = payload.invoiceNo || payload.bill_no || '';
    payload.bill_no = payload.bill_no || payload.invoiceNo || '';

    if (!payload.invoiceNo) {
      res.status(400);
      throw new Error('invoiceNo is required');
    }

    normalizeSaleSource(payload, true);
    payload.remarks = String(payload.remarks || '').trim();
    normalizeSalePayment(payload);
    const created = await Sale.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Duplicate invoice number. Please retry with a new bill.'
      });
      return;
    }
    next(error);
  }
};

const updateSale = async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.invoiceNo || payload.bill_no) {
      payload.invoiceNo = payload.invoiceNo || payload.bill_no;
      payload.bill_no = payload.bill_no || payload.invoiceNo;
    }
    normalizeSaleSource(payload, true);
    if (Object.prototype.hasOwnProperty.call(payload, 'remarks')) {
      payload.remarks = String(payload.remarks || '').trim();
    }
    normalizeSalePayment(payload);

    const updated = await Sale.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });
    if (!updated) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const updateSalePayment = async (req, res, next) => {
  try {
    const amount = Math.max(0, Number(req.body.amount || 0));
    if (amount <= 0) {
      res.status(400);
      throw new Error('Payment amount must be greater than 0');
    }

    const row = await Sale.findById(req.params.id);
    if (!row) {
      res.status(404);
      throw new Error('Sale not found');
    }

    if (String(row.billType || 'SALES').toUpperCase() !== 'SALES') {
      res.status(400);
      throw new Error('Payments can be collected only for sales bills');
    }

    const nextPaid = Math.min(Math.abs(Number(row.netAmount || 0)), Number(row.paidAmount || 0) + amount);
    row.payments.push({
      amount,
      mode: String(req.body.mode || row.paymentMode || 'CASH').toUpperCase(),
      note: String(req.body.note || '').trim(),
      paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date()
    });
    row.paidAmount = Number(nextPaid.toFixed(2));
    row.dueAmount = Number((Math.abs(Number(row.netAmount || 0)) - row.paidAmount).toFixed(2));
    if (row.dueAmount <= 0) row.paymentStatus = 'COMPLETED';
    else if (row.paidAmount > 0) row.paymentStatus = 'PARTIAL';
    else row.paymentStatus = 'PENDING';

    await row.save();
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const getDayEndSummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const [summary] = await Sale.aggregate([
      {
        $match: {
          billType: 'SALES',
          createdAt: { $gte: start, $lte: end },
          cancelledAt: null
        }
      },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ['$netAmount', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        date,
        totalBills: summary?.totalBills || 0,
        totalAmount: summary?.totalAmount || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSale = async (req, res, next) => {
  try {
    const row = await Sale.findById(req.params.id);
    if (!row) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const holdSale = async (req, res, next) => {
  try {
    const row = await Sale.findByIdAndUpdate(
      req.params.id,
      { isHold: !!req.body.isHold },
      { new: true }
    );
    if (!row) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const cancelSale = async (req, res, next) => {
  try {
    const row = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        paymentStatus: 'CANCELLED',
        cancelReason: req.body.reason || '',
        cancelledAt: new Date()
      },
      { new: true }
    );
    if (!row) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

const deleteSale = async (req, res, next) => {
  try {
    const deleted = await Sale.findByIdAndDelete(req.params.id);
    if (!deleted) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, message: 'Sale deleted', data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};

const getPrintableSale = async (req, res, next) => {
  try {
    const row = await Sale.findById(req.params.id);
    if (!row) {
      res.status(404);
      throw new Error('Sale not found');
    }
    res.json({ success: true, data: { ...row.toJSON(), printable: true } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSales,
  createSale,
  updateSale,
  updateSalePayment,
  getDayEndSummary,
  getSale,
  holdSale,
  cancelSale,
  deleteSale,
  getPrintableSale
};
