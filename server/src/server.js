const dotenv = require('dotenv');
const app = require('./app');
const User = require('./models/User');
const MasterClient = require('./models/MasterClient');
const connectDB = require('./config/db').connectDB;
const { runWithTenant, getDefaultTenantDb } = require('./context/tenantContext');
const { getTenantConnection } = require('./config/db');
const { cloneDatabaseWithData } = require('./services/tenantProvisioningService');

dotenv.config();

const PORT = process.env.PORT || 5000;

const extractDbNameFromMongoUri = (mongoUri = '') => {
  if (!mongoUri) return null;
  const withoutQuery = mongoUri.split('?')[0];
  const parts = withoutQuery.split('/');
  const dbName = parts[parts.length - 1];
  return dbName || null;
};

const getCoreCollectionCounts = async (dbName) => {
  const conn = await getTenantConnection(dbName);
  const coreCollections = [
    'items',
    'customers',
    'suppliers',
    'sales',
    'purchases',
    'expenses',
    'warehouses',
  ];

  let total = 0;
  for (const name of coreCollections) {
    const exists = await conn.db.listCollections({ name }).toArray();
    if (!exists.length) continue;
    total += await conn.db.collection(name).countDocuments();
  }

  return total;
};

const clearCoreCollections = async (dbName) => {
  const conn = await getTenantConnection(dbName);
  const collections = [
    'items',
    'customers',
    'suppliers',
    'sales',
    'purchases',
    'expenses',
    'warehouses',
    'returns',
    'employees',
    'payrolls',
    'cashflows',
    'budgets',
    'budgetperiods',
  ];

  for (const name of collections) {
    const exists = await conn.db.listCollections({ name }).toArray();
    if (!exists.length) continue;
    await conn.db.collection(name).deleteMany({});
  }
};

const ensureDefaultClientSetup = async () => {
  const defaultDbName = getDefaultTenantDb();
  const legacyDbName =
    process.env.LEGACY_DATA_DB || extractDbNameFromMongoUri(process.env.MONGODB_URI);
  const defaultDomainUser = (process.env.DEFAULT_DEMO_USER || 'ramesh@demo').toLowerCase();
  const defaultPassword = process.env.DEFAULT_DEMO_PASSWORD || 'Ramesh123';
  const legacyAdminUser = (process.env.DEFAULT_LEGACY_ADMIN_USER || 'admin').toLowerCase();
  const legacyAdminPassword = process.env.DEFAULT_LEGACY_ADMIN_PASSWORD || 'admin123';

  if (process.env.CLEAN_DEMO_DATA_ON_BOOT === 'true') {
    await clearCoreCollections(defaultDbName);
    console.log(`Core business data cleared for tenant DB: ${defaultDbName}`);
  }

  // One-time data carry-forward: move old single-db data into demo tenant if demo is empty.
  if (
    legacyDbName &&
    legacyDbName !== defaultDbName &&
    process.env.INIT_DEMO_FROM_LEGACY === 'true'
  ) {
    const demoCount = await getCoreCollectionCounts(defaultDbName);
    const legacyCount = await getCoreCollectionCounts(legacyDbName);

    if (demoCount === 0 && legacyCount > 0) {
      const result = await cloneDatabaseWithData(legacyDbName, defaultDbName);
      console.log(
        `Demo DB initialized from legacy DB: ${result.sourceDbName} -> ${result.targetDbName} (${result.collectionsCopied} collections)`
      );
    }
  }

  let masterClient = await MasterClient.findOne({ domain_user: defaultDomainUser });
  if (!masterClient) {
    masterClient = await MasterClient.findOne({ database_name: defaultDbName });
  }
  if (!masterClient) {
    masterClient = await MasterClient.create({
      client_name: process.env.DEFAULT_DEMO_CLIENT_NAME || 'Ramesh Exports',
      database_name: defaultDbName,
      domain_user: defaultDomainUser,
      password: defaultPassword,
      status: 'active',
    });

    console.log(
      `Default master client created: domain_user=${masterClient.domain_user}, database=${masterClient.database_name}`
    );
  } else {
    let shouldSave = false;
    if (String(masterClient.domain_user || '').toLowerCase() !== defaultDomainUser) {
      masterClient.domain_user = defaultDomainUser;
      shouldSave = true;
    }
    if (String(masterClient.database_name || '').toLowerCase() !== defaultDbName) {
      masterClient.database_name = defaultDbName;
      shouldSave = true;
    }
    if (String(masterClient.status || '').toLowerCase() !== 'active') {
      masterClient.status = 'active';
      shouldSave = true;
    }
    if (shouldSave) {
      await masterClient.save();
    }
  }

  await runWithTenant(masterClient.database_name, async () => {
    const tenantUser = await User.findOne({ email: masterClient.domain_user });
    if (!tenantUser) {
      await User.create({
        name: `${masterClient.client_name} Admin`,
        username: masterClient.domain_user,
        email: masterClient.domain_user,
        password: defaultPassword,
        role: 'admin',
      });

      console.log(
        `Default tenant admin created: username=${masterClient.domain_user} password=${defaultPassword}`
      );
    }

    const legacyAdmin = await User.findOne({ email: legacyAdminUser });
    if (!legacyAdmin) {
      await User.create({
        name: 'Default Admin',
        username: legacyAdminUser,
        email: legacyAdminUser,
        password: legacyAdminPassword,
        role: 'admin',
      });
      console.log(
        `Legacy default admin created: username=${legacyAdminUser} password=${legacyAdminPassword}`
      );
    }
  });
};

const startServer = async () => {
  try {
    await connectDB();
    await ensureDefaultClientSetup();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
