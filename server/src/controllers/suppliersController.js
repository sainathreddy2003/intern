const Supplier = require('../models/Supplier');
const { getPagination } = require('../utils/pagination');

const searchSuppliers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const data = await Supplier.find({
      $or: [{ supplier_name: regex }, { supplier_code: regex }, { mobile: regex }, { supplying_fabric: regex }]
    })
      .sort({ supplier_name: 1 })
      .limit(20);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const listSuppliers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const q = (req.query.q || '').trim();
    const filter = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ supplier_name: regex }, { supplier_code: regex }, { mobile: regex }, { supplying_fabric: regex }];
    }

    const [data, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Supplier.countDocuments(filter)
    ]);

    res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getSupplier = async (req, res, next) => {
  try {
    const data = await Supplier.findById(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Supplier not found');
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { supplier_code, supplier_name } = req.body;
    if (!supplier_code || !supplier_name) {
      res.status(400);
      throw new Error('supplier_code and supplier_name are required');
    }

    const data = await Supplier.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const data = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!data) {
      res.status(404);
      throw new Error('Supplier not found');
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    const data = await Supplier.findByIdAndDelete(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Supplier not found');
    }

    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchSuppliers,
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
