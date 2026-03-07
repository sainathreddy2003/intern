const mongoose = require('mongoose');
const { getDefaultTenantDb } = require('../context/tenantContext');

let masterConnection = null;
const tenantConnections = new Map();

const getMongoUri = () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }
  return mongoUri;
};

const getMasterDbName = () => process.env.MASTER_DB_NAME || 'erp_master';

const connectDB = async () => {
  const mongoUri = getMongoUri();

  if (!masterConnection) {
    masterConnection = mongoose.createConnection(mongoUri, {
      dbName: getMasterDbName(),
    });
    await masterConnection.asPromise();
    console.log(`Master DB connected: ${getMasterDbName()}`);
  }

  ensureTenantConnection(getDefaultTenantDb());
};

const getMasterConnection = () => {
  if (!masterConnection) {
    throw new Error('Master DB is not connected. Call connectDB() first.');
  }
  return masterConnection;
};

const ensureTenantConnection = (dbName) => {
  const tenantDbName = dbName || getDefaultTenantDb();

  if (tenantConnections.has(tenantDbName)) {
    return tenantConnections.get(tenantDbName);
  }

  const conn = mongoose.createConnection(getMongoUri(), { dbName: tenantDbName });
  conn.on('error', (err) => {
    console.error(`Tenant DB error (${tenantDbName}):`, err.message);
  });
  conn.once('open', () => {
    console.log(`Tenant DB connected: ${tenantDbName}`);
  });

  tenantConnections.set(tenantDbName, conn);
  return conn;
};

const getTenantConnection = async (dbName) => {
  const conn = ensureTenantConnection(dbName);
  await conn.asPromise();
  return conn;
};

const getTenantModel = (dbName, modelName, schema) => {
  const conn = ensureTenantConnection(dbName);
  return conn.models[modelName] || conn.model(modelName, schema);
};

module.exports = {
  connectDB,
  getMasterConnection,
  getTenantConnection,
  getTenantModel,
};
