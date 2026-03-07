import Dexie from 'dexie';

// Create IndexedDB database
export const offlineDB = new Dexie('RetailERPOffline');

// Define database schema
offlineDB.version(1).stores({
  // Authentication data
  auth: '++id, token, user, timestamp',
  
  // Master data
  masterData: 'id, lastSyncTime',
  items: '++item_id, item_code, item_name, group_id, is_active, selling_price',
  itemGroups: '++group_id, group_name, parent_group_id, is_active',
  units: '++unit_id, unit_name, unit_symbol, is_active',
  taxes: '++tax_id, tax_name, tax_percentage, is_active',
  customers: '++customer_id, customer_code, customer_name, is_active',
  suppliers: '++supplier_id, supplier_code, supplier_name, is_active',
  batches: '++batch_id, item_id, batch_number, quantity, expiry_date',
  stock: '++id, item_id, branch_id, current_stock, latest_date',
  coupons: '++coupon_id, coupon_code, is_active, valid_from, valid_to',
  config: '++config_key, config_value, config_type',
  
  // Transaction data
  salesHdr: '++bill_no, bill_date, customer_id, status, sync_status',
  salesDtl: '++sales_dtl_id, bill_no, item_id, quantity, rate',
  salesPayment: '++payment_id, bill_no, payment_mode, payment_amount',
  purchaseHdr: '++purchase_id, purchase_date, supplier_id, status',
  purchaseDtl: '++purchase_dtl_id, purchase_id, item_id, quantity, rate',
  stockLedger: '++ledger_id, transaction_date, item_id, transaction_type',
  
  // Offline queue for syncing
  offlineQueue: '++id, tableName, operation, recordId, timestamp, retryCount',
  
  // Temporary data
  tempCart: '++id, item_id, quantity, rate, timestamp',
  heldBills: '++id, bill_no, bill_data, timestamp',
});

// Add helper methods for offline operations without overriding Dexie table objects
offlineDB.items.search = async (query = '') => {
  const q = query.toLowerCase().trim();
  const items = await offlineDB.items.toArray();

  if (!q) return items;

  return items.filter((item) =>
    String(item.item_name || '').toLowerCase().includes(q) ||
    String(item.item_code || '').toLowerCase().includes(q) ||
    String(item.barcode || '').toLowerCase().includes(q)
  );
};

offlineDB.items.getByGroup = async (groupId) => {
  return await offlineDB.items
    .where('group_id')
    .equals(groupId)
    .and((item) => item.is_active)
    .toArray();
};

offlineDB.items.getLowStock = async () => {
  const items = await offlineDB.items.toArray();
  const lowStockItems = [];

  for (const item of items) {
    const stock = await offlineDB.stock
      .where('item_id')
      .equals(item.item_id)
      .first();

    if (stock && stock.current_stock <= item.min_stock_level) {
      lowStockItems.push({
        ...item,
        currentStock: stock.current_stock,
      });
    }
  }

  return lowStockItems;
};

offlineDB.customers.search = async (query = '') => {
  const q = query.toLowerCase().trim();
  const customers = await offlineDB.customers.toArray();

  if (!q) return customers;

  return customers.filter((customer) =>
    String(customer.customer_name || '').toLowerCase().includes(q) ||
    String(customer.customer_code || '').toLowerCase().includes(q) ||
    String(customer.mobile || '').toLowerCase().includes(q)
  );
};

offlineDB.suppliers.search = async (query = '') => {
  const q = query.toLowerCase().trim();
  const suppliers = await offlineDB.suppliers.toArray();

  if (!q) return suppliers;

  return suppliers.filter((supplier) =>
    String(supplier.supplier_name || '').toLowerCase().includes(q) ||
    String(supplier.supplier_code || '').toLowerCase().includes(q) ||
    String(supplier.mobile || '').toLowerCase().includes(q)
  );
};

offlineDB.salesHdr.getByDateRange = async (startDate, endDate) => {
  return await offlineDB.salesHdr
    .where('bill_date')
    .between(startDate, endDate, true, true)
    .toArray();
};

offlineDB.salesHdr.getByCustomer = async (customerId) => {
  return await offlineDB.salesHdr
    .where('customer_id')
    .equals(customerId)
    .toArray();
};

offlineDB.salesHdr.getPendingSync = async () => {
  return await offlineDB.salesHdr
    .where('sync_status')
    .equals('PENDING')
    .toArray();
};

offlineDB.offlineQueue.getByTable = async (tableName) => {
  return await offlineDB.offlineQueue
    .where('tableName')
    .equals(tableName)
    .toArray();
};

offlineDB.offlineQueue.getFailed = async () => {
  return await offlineDB.offlineQueue
    .where('retryCount')
    .above(2)
    .toArray();
};

offlineDB.offlineQueue.clearOld = async (daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await offlineDB.offlineQueue
    .where('timestamp')
    .below(cutoffDate.toISOString())
    .delete();
};

offlineDB.tempCart.getCurrent = async () => {
  return await offlineDB.tempCart.toArray();
};

offlineDB.tempCart.addItem = async (item) => {
  const existingItem = await offlineDB.tempCart
    .where('item_id')
    .equals(item.item_id)
    .first();

  if (existingItem) {
    return await offlineDB.tempCart.update(existingItem.id, {
      quantity: existingItem.quantity + item.quantity,
      amount: (existingItem.quantity + item.quantity) * item.rate,
      timestamp: new Date().toISOString(),
    });
  }

  return await offlineDB.tempCart.add({
    ...item,
    timestamp: new Date().toISOString(),
  });
};

offlineDB.tempCart.updateQuantity = async (itemId, quantity) => {
  const item = await offlineDB.tempCart.get(itemId);
  if (item) {
    return await offlineDB.tempCart.update(itemId, {
      quantity,
      amount: quantity * item.rate,
      timestamp: new Date().toISOString(),
    });
  }

  return 0;
};

offlineDB.tempCart.removeItem = async (itemId) => {
  return await offlineDB.tempCart.delete(itemId);
};

offlineDB.tempCart.clear = async () => {
  return await offlineDB.tempCart.clear();
};

offlineDB.tempCart.getTotals = async () => {
  const items = await offlineDB.tempCart.toArray();

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    items,
    subtotal,
    totalQuantity,
    itemCount: items.length,
  };
};

offlineDB.heldBills.holdBill = async (billData) => {
  return await offlineDB.heldBills.add({
    bill_no: `HOLD-${Date.now()}`,
    bill_data: billData,
    timestamp: new Date().toISOString(),
  });
};

offlineDB.heldBills.getAll = async () => {
  return await offlineDB.heldBills.reverse().toArray();
};

offlineDB.heldBills.releaseBill = async (id) => {
  const heldBill = await offlineDB.heldBills.get(id);
  if (heldBill) {
    await offlineDB.heldBills.delete(id);
    return heldBill.bill_data;
  }

  return null;
};

offlineDB.heldBills.deleteBill = async (id) => {
  return await offlineDB.heldBills.delete(id);
};

// Export the database instance
export default offlineDB;
