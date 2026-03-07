const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { runWithTenant } = require('../context/tenantContext');

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.dbName) {
      res.status(401);
      throw new Error('Not authorized, tenant database missing in token');
    }

    const user = await runWithTenant(decoded.dbName, async () =>
      User.findById(decoded.id).select('-password')
    );

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    req.tenantDbName = decoded.dbName;
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
