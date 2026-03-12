const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { runWithTenant, getDefaultTenantDb } = require('../context/tenantContext');

const resolveTenantDb = (decodedDbName) => {
  const masterDbName = (process.env.MASTER_DB_NAME || 'erp_master').trim();
  const defaultTenantDb = getDefaultTenantDb();
  if (!decodedDbName) return null;
  return decodedDbName === masterDbName ? defaultTenantDb : decodedDbName;
};

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tenantDbName = resolveTenantDb(decoded?.dbName);
    if (!tenantDbName) {
      res.status(401);
      throw new Error('Not authorized, tenant database missing in token');
    }

    const user = await runWithTenant(tenantDbName, async () =>
      User.findById(decoded.id).select('-password')
    );

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    req.tenantDbName = tenantDbName;
    next();
  } catch (error) {
    if (res.statusCode === 200) {
      res.status(401);
    }
    next(error);
  }
};

module.exports = {
  protect,
};
