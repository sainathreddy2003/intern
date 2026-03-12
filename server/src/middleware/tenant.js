const jwt = require('jsonwebtoken');
const { runWithTenant, getDefaultTenantDb } = require('../context/tenantContext');

const resolveTenantDb = (decodedDbName) => {
  const masterDbName = (process.env.MASTER_DB_NAME || 'erp_master').trim();
  const defaultTenantDb = getDefaultTenantDb();
  if (!decodedDbName) return defaultTenantDb;
  return decodedDbName === masterDbName ? defaultTenantDb : decodedDbName;
};

const attachTenantContext = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  let dbName = getDefaultTenantDb();

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      dbName = resolveTenantDb(decoded?.dbName);
    } catch (error) {
      // Keep default tenant for unauthenticated or invalid token paths.
    }
  }

  req.tenantDbName = dbName;
  runWithTenant(dbName, () => next());
};

module.exports = {
  attachTenantContext,
};
