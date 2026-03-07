const Customer = require('../models/Customer');
const { getPagination } = require('../utils/pagination');

const searchCustomers = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const customers = await Customer.find({
      $or: [
        { customer_name: regex },
        { customer_code: regex },
        { mobile: regex }
      ]
    })
      .sort({ customer_name: 1 })
      .limit(20);

    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

const getCustomerByCode = async (req, res, next) => {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      res.status(400);
      throw new Error('Customer code is required');
    }

    const customer = await Customer.findOne({ customer_code: code });
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

const listCustomers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const q = (req.query.q || '').trim();

    const filter = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { customer_name: regex },
        { customer_code: regex },
        { mobile: regex }
      ];
    }

    const [data, total] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Customer.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data,
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

const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const { customer_code, customer_name } = req.body;
    if (!customer_code || !customer_name) {
      res.status(400);
      throw new Error('customer_code and customer_name are required');
    }

    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      res.status(404);
      throw new Error('Customer not found');
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchCustomers,
  getCustomerByCode,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
