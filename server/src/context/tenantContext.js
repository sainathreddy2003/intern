const { AsyncLocalStorage } = require('async_hooks');

const tenantStorage = new AsyncLocalStorage();

const getDefaultTenantDb = () => process.env.DEFAULT_TENANT_DB || 'erp_demo';

const runWithTenant = (dbName, callback) => {
  const tenantDbName = dbName || getDefaultTenantDb();
  return tenantStorage.run({ tenantDbName }, callback);
};

const getTenantDbName = () => {
  const store = tenantStorage.getStore();
  return store?.tenantDbName || getDefaultTenantDb();
};

module.exports = {
  runWithTenant,
  getTenantDbName,
  getDefaultTenantDb,
};
