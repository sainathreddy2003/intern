const Item = require('../models/Item');
const { getPagination } = require('../utils/pagination');

const normalizeBarcode = (value = '') => String(value || '').trim();

const buildItemCodeFromBarcode = (barcode = '') => {
  const clean = String(barcode).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean ? `FB-${clean.slice(0, 12)}` : '';
};

const resolveUniqueItemCode = async (preferredCode = '') => {
  const base = String(preferredCode || '').trim().toUpperCase() || `FB-${Date.now().toString().slice(-8)}`;
  let candidate = base;
  let suffix = 1;
  while (await Item.exists({ item_code: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
};

const mapItemToClient = (itemDoc) => {
  const item = typeof itemDoc.toJSON === 'function' ? itemDoc.toJSON() : itemDoc;

  // Base field fallbacks
  const purchasePrice = Number(item.purchase_price || 0);
  const salePrice = Number(item.sale_price || 0);
  const stockValue = Number(item.stock ?? 0);
  const currentStockValue = Number(item.current_stock ?? 0);
  const stock =
    currentStockValue > 0 || stockValue === 0
      ? currentStockValue
      : stockValue;
  const taxPct = Number(item.tax_percentage || item.tax || 0);
  const pieceMeter = Number(item.piece_meter || (item.unit_name === 'ROLL' ? 1 : Number(item.unit_name) || 1));

  // Derived fields with intelligent fallbacks
  const costPerQtyRaw = Number(item.cost_per_qty || purchasePrice || 0);
  const costRaw = Number(item.cost || (costPerQtyRaw > 0 ? costPerQtyRaw * pieceMeter : item.net_cost || 0));
  const cost = costRaw > 0 ? costRaw : Number(item.net_cost || 0);
  const costPerQty = costPerQtyRaw > 0 ? costPerQtyRaw : (pieceMeter > 0 ? cost / pieceMeter : cost);

  const discountPercent = Number(item.discount_percent || 0);
  const discountAmount = Number(item.discount_amount || (cost * discountPercent / 100));
  const taxAmount = Number(item.tax_amount || ((cost - discountAmount) * taxPct / 100));
  const netCost = Number(item.net_cost || (cost - discountAmount + taxAmount));
  const sellingPrice = Number(item.selling_price || salePrice || 0);
  const sellingPricePerPc = Number(item.selling_price_per_piece || (sellingPrice * pieceMeter));
  const netAmount = Number(item.net_amount || netCost);
  const roiPct = Number(item.roi_percent || (netCost > 0 ? ((sellingPrice - netCost) / netCost * 100) : 0));
  const grossPct = Number(item.gross_profit_percent || (sellingPrice > 0 ? ((sellingPrice - netCost) / sellingPrice * 100) : 0));

  return {
    ...item,
    group_id: item.group_id || item.group || '',
    group_name: item.group_name || item.group || '',
    unit_name: item.unit_name || item.unit || 'Nos',
    hsn_code: item.hsn_code || '',
    piece_meter: pieceMeter,
    cost_per_qty: costPerQty,
    cost: cost,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    tax_percentage: taxPct,
    tax_amount: taxAmount,
    net_cost: netCost,
    selling_price: sellingPrice,
    selling_price_per_piece: sellingPricePerPc,
    net_amount: netAmount,
    roi_percent: roiPct,
    gross_profit_percent: grossPct,
    current_stock: stock,
    stock: stock,
    min_stock_level: Number(item.min_stock_level ?? 0)
  };
};

const mapPayloadToDb = (payload = {}) => ({
  ...payload,
  barcode: normalizeBarcode(payload.barcode),
  item_code: (payload.item_code || buildItemCodeFromBarcode(payload.barcode || '')).trim().toUpperCase(),
  group_id: payload.group_id ?? payload.group ?? '',
  group: payload.group ?? payload.group_name ?? payload.group_id ?? payload.group ?? 'General',
  item_type: String(payload.item_type || 'GENERAL').toUpperCase(),
  fabric_type: payload.fabric_type || '',
  color: payload.color || '',
  design: payload.design || '',
  width_inch: Number(payload.width_inch || 0),
  gsm: Number(payload.gsm || 0),
  roll_length: Number(payload.roll_length || 0),
  sale_price: payload.sale_price ?? payload.selling_price ?? 0,
  stock: payload.stock ?? payload.current_stock ?? 0,
  unit:
    payload.unit ??
    payload.unit_name ??
    (String(payload.item_type || '').toUpperCase() === 'FABRIC' ? 'MTR' : 'Nos'),
  tax: payload.tax ?? payload.tax_percentage ?? 0
});

const getGroups = async (req, res, next) => {
  try {
    const groups = await Item.distinct('group');
    const data = groups
      .filter(Boolean)
      .sort()
      .map((groupName) => ({
        group_id: groupName,
        group_name: groupName
      }));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getUnits = async (req, res, next) => {
  try {
    const units = await Item.distinct('unit');
    res.json({ success: true, data: units.filter(Boolean).sort() });
  } catch (error) {
    next(error);
  }
};

const getTaxRates = async (req, res, next) => {
  try {
    const taxes = await Item.distinct('tax');
    res.json({ success: true, data: taxes.sort((a, b) => a - b) });
  } catch (error) {
    next(error);
  }
};

const searchItems = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const data = await Item.find({
      $or: [{ item_name: regex }, { item_code: regex }, { barcode: regex }, { group: regex }]
    })
      .sort({ item_name: 1 })
      .limit(20);

    res.json({ success: true, data: data.map(mapItemToClient) });
  } catch (error) {
    next(error);
  }
};

const getItemByBarcode = async (req, res, next) => {
  try {
    const barcode = normalizeBarcode(req.params.barcode);
    if (!barcode) {
      res.status(400);
      throw new Error('barcode is required');
    }
    const data = await Item.findOne({ barcode });
    if (!data) {
      res.status(404);
      throw new Error('Item not found');
    }
    res.json({ success: true, data: mapItemToClient(data) });
  } catch (error) {
    next(error);
  }
};

const listItems = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const q = (req.query.q || '').trim();
    const itemType = String(req.query.itemType || '').trim().toUpperCase();
    const filter = {};

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ item_name: regex }, { item_code: regex }, { barcode: regex }, { group: regex }];
    }

    if (itemType) {
      filter.item_type = itemType;
    }

    const [data, total] = await Promise.all([
      Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items: data.map(mapItemToClient),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getItem = async (req, res, next) => {
  try {
    const data = await Item.findById(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Item not found');
    }
    res.json({ success: true, data: mapItemToClient(data) });
  } catch (error) {
    next(error);
  }
};

const createItem = async (req, res, next) => {
  try {
    const barcode = normalizeBarcode(req.body?.barcode);
    const itemName = String(req.body?.item_name || '').trim();
    if (!barcode || !itemName) {
      res.status(400);
      throw new Error('barcode and item_name are required');
    }

    const duplicateBarcode = await Item.findOne({ barcode }).select('_id');
    if (duplicateBarcode) {
      res.status(400);
      throw new Error('Barcode already exists');
    }

    const preferredCode = req.body?.item_code || buildItemCodeFromBarcode(barcode);
    const uniqueCode = await resolveUniqueItemCode(preferredCode);
    const data = await Item.create(mapPayloadToDb({ ...req.body, barcode, item_name: itemName, item_code: uniqueCode }));
    res.status(201).json({ success: true, data: mapItemToClient(data) });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400);
      return res.json({ success: false, message: 'Duplicate value found. Use a different barcode.' });
    }
    next(error);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const barcode = normalizeBarcode(req.body?.barcode);
    const itemName = String(req.body?.item_name || '').trim();
    if (!barcode || !itemName) {
      res.status(400);
      throw new Error('barcode and item_name are required');
    }
    const duplicateBarcode = await Item.findOne({
      barcode,
      _id: { $ne: req.params.id }
    }).select('_id');
    if (duplicateBarcode) {
      res.status(400);
      throw new Error('Barcode already exists');
    }

    const existingItem = await Item.findById(req.params.id).select('item_code');
    if (!existingItem) {
      res.status(404);
      throw new Error('Item not found');
    }
    const preferredCode = req.body?.item_code || buildItemCodeFromBarcode(barcode);
    const itemCodeInUseByOther = await Item.exists({
      item_code: String(preferredCode).trim().toUpperCase(),
      _id: { $ne: req.params.id }
    });
    const finalCode = itemCodeInUseByOther ? await resolveUniqueItemCode(preferredCode) : preferredCode;

    const data = await Item.findByIdAndUpdate(req.params.id, mapPayloadToDb({ ...req.body, item_code: finalCode }), {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: mapItemToClient(data) });
  } catch (error) {
    if (error?.code === 11000) {
      res.status(400);
      return res.json({ success: false, message: 'Duplicate value found. Use a different barcode.' });
    }
    next(error);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const data = await Item.findByIdAndDelete(req.params.id);
    if (!data) {
      res.status(404);
      throw new Error('Item not found');
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGroups,
  getUnits,
  getTaxRates,
  searchItems,
  getItemByBarcode,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
};
