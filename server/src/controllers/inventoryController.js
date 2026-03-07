const Item = require('../models/Item');
const { getPagination } = require('../utils/pagination');

const mapItemToInventory = (itemDoc) => {
  const item = typeof itemDoc.toJSON === 'function' ? itemDoc.toJSON() : itemDoc;

  // Base field fallbacks
  const purchasePrice = Number(item.purchase_price || 0);
  const salePrice = Number(item.sale_price || 0);
  const stockValue = Number(item.stock ?? 0);
  const currentStockValue = Number(item.current_stock ?? 0);
  // Prefer the field that actually carries quantity; legacy data may keep one stale at 0.
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
    min_stock_level: Number(item.min_stock_level ?? 0),
    valuation: Number((stock * cost).toFixed(2))
  };
};

const getStock = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const q = (req.query.search || req.query.q || '').trim();
    const lowStock = req.query.lowStock === 'true' || req.query.lowStock === true;
    const groupId = (req.query.groupId || '').trim();
    const itemType = String(req.query.itemType || '').trim().toUpperCase();
    const fabricOnly = req.query.fabricOnly === 'true' || req.query.fabricOnly === true;
    const filter = {};

    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ item_name: regex }, { item_code: regex }, { group: regex }];
    }

    if (groupId) {
      filter.$or = [{ group: groupId }, { group_id: groupId }];
    }

    if (itemType) {
      filter.item_type = itemType;
    } else if (fabricOnly) {
      filter.item_type = 'FABRIC';
    }

    if (lowStock) {
      filter.$expr = {
        $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$min_stock_level', 0] }]
      };
    }

    const [rows, total] = await Promise.all([
      Item.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Item.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items: rows.map(mapItemToInventory),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getLedger = (req, res) => res.json({ success: true, data: [] });

const adjustStock = async (req, res, next) => {
  try {
    const { itemId, quantity } = req.body;
    if (!itemId || typeof quantity !== 'number') {
      res.status(400);
      throw new Error('itemId and numeric quantity are required');
    }

    const item = await Item.findById(itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found');
    }

    item.stock += quantity;
    item.current_stock = item.stock;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

const getBatches = (req, res) => res.json({ success: true, data: [] });

const getLowStock = async (req, res, next) => {
  try {
    const thresholdParam = req.query.threshold;
    const threshold = typeof thresholdParam !== 'undefined' ? Number(thresholdParam) : null;
    const filter =
      threshold !== null
        ? { stock: { $lte: threshold } }
        : {
          $expr: {
            $lte: [{ $ifNull: ['$stock', 0] }, { $ifNull: ['$min_stock_level', 0] }]
          }
        };

    const data = await Item.find(filter).sort({ item_name: 1 });
    res.json({ success: true, data: data.map(mapItemToInventory) });
  } catch (error) {
    next(error);
  }
};

const getExpiring = (req, res) => res.json({ success: true, data: [] });

module.exports = {
  getStock,
  getLedger,
  adjustStock,
  getBatches,
  getLowStock,
  getExpiring
};
