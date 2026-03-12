const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MasterClient = require('../models/MasterClient');
const { runWithTenant, getDefaultTenantDb } = require('../context/tenantContext');
const { cloneTemplateSchema } = require('../services/tenantProvisioningService');
const { getTenantConnection } = require('../config/db');

const normalizeLogin = (value = '') => value.trim().toLowerCase();

const clearTenantBusinessData = async (dbName) => {
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

const generateToken = ({ id, dbName, clientId, domainUser }) => {
  const secret = process.env.JWT_SECRET || 'change-me-in-env';
  return jwt.sign({ id, dbName, clientId, domainUser }, secret, { expiresIn: '7d' });
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('name, email and password are required');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400);
      throw new Error('User already exists');
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.create({
      name,
      username: normalizedEmail,
      email: normalizedEmail,
      password,
      role,
    });
    const dbName = req.tenantDbName || getDefaultTenantDb();
    const token = generateToken({ id: user._id, dbName });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          dbName,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('email and password are required');
    }

    const loginId = normalizeLogin(email);
    const defaultDomainUser = (process.env.DEFAULT_DEMO_USER || 'ramesh@demo').toLowerCase();
    const defaultPassword = process.env.DEFAULT_DEMO_PASSWORD || 'Ramesh123';
    const defaultDbName = getDefaultTenantDb();
    const loginAliases = [loginId];
    if (!loginId.includes('@')) loginAliases.push(`${loginId}@demo`);

    let masterClient = await MasterClient.findOne({
      domain_user: { $in: loginAliases },
    });
    if (!masterClient && isDefaultDemoLogin) {
      masterClient = await MasterClient.findOne({ database_name: defaultDbName });
    }

    const isDefaultDemoLogin =
      loginAliases.includes(defaultDomainUser) ||
      loginAliases.includes(String(defaultDomainUser || '').split('@')[0]);

    if (!masterClient && isDefaultDemoLogin && password === defaultPassword) {
      masterClient = await MasterClient.findOne({ database_name: defaultDbName });
      if (!masterClient) {
        masterClient = await MasterClient.create({
          client_name: process.env.DEFAULT_DEMO_CLIENT_NAME || 'Ramesh Exports',
          database_name: defaultDbName,
          domain_user: defaultDomainUser,
          password: defaultPassword,
          status: 'active',
        });
      }
    }

    if (masterClient && isDefaultDemoLogin && password === defaultPassword) {
      masterClient.domain_user = defaultDomainUser;
      masterClient.status = 'active';
      const isMasterPasswordValid = await masterClient.matchPassword(password);
      if (!isMasterPasswordValid) {
        masterClient.password = defaultPassword;
      }
      await masterClient.save();
    }

    // Backward-compatible default login support: admin/admin123
    if (!masterClient) {
      const legacyAdminUser = (process.env.DEFAULT_LEGACY_ADMIN_USER || 'admin').toLowerCase();
      const legacyAdminPassword = process.env.DEFAULT_LEGACY_ADMIN_PASSWORD || 'admin123';
      if (loginId === legacyAdminUser && password === legacyAdminPassword) {
        // Special requirement: admin/admin123 login should start with a clean dataset.
        await clearTenantBusinessData(defaultDbName);
        const legacyUser = await runWithTenant(defaultDbName, async () => {
          let tenantUser = await User.findOne({ email: legacyAdminUser });
          if (!tenantUser) {
            tenantUser = await User.create({
              name: 'Default Admin',
              username: legacyAdminUser,
              email: legacyAdminUser,
              password: legacyAdminPassword,
              role: 'admin',
            });
            return tenantUser;
          }

          const isTenantPasswordValid = await tenantUser.matchPassword(legacyAdminPassword);
          if (!isTenantPasswordValid) {
            tenantUser.password = legacyAdminPassword;
            await tenantUser.save();
          }
          return tenantUser;
        });

        const token = generateToken({
          id: legacyUser._id,
          dbName: defaultDbName,
          domainUser: legacyAdminUser,
        });

        res.json({
          success: true,
          data: {
            user: {
              id: legacyUser._id,
              name: legacyUser.name,
              email: legacyUser.email,
              role: legacyUser.role,
              client_name: process.env.DEFAULT_DEMO_CLIENT_NAME || 'Ramesh Exports',
              dbName: defaultDbName,
            },
            token,
          },
        });
        return;
      }

      res.status(401);
      throw new Error('Invalid credentials');
    }

    const isMasterPasswordValid = await masterClient.matchPassword(password);
    if (!isMasterPasswordValid) {
      res.status(401);
      throw new Error('Invalid credentials');
    }

    const dbName = masterClient.database_name;

    const user = await runWithTenant(dbName, async () => {
      let tenantUser = await User.findOne({
        $or: [{ email: loginId }, { username: email }, { email: masterClient.domain_user }],
      });

      if (!tenantUser) {
        tenantUser = await User.create({
          name: `${masterClient.client_name} Admin`,
          username: masterClient.domain_user,
          email: masterClient.domain_user,
          password,
          role: 'admin',
        });
        return tenantUser;
      }

      const isTenantPasswordValid = await tenantUser.matchPassword(password);
      if (!isTenantPasswordValid) {
        tenantUser.password = password;
        await tenantUser.save();
      }

      return tenantUser;
    });

    const token = generateToken({
      id: user._id,
      dbName,
      clientId: masterClient._id,
      domainUser: masterClient.domain_user,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          client_name: masterClient.client_name,
          dbName,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const provisionClientDatabase = async (req, res, next) => {
  try {
    const { client_name, database_name, domain_user, password, status } = req.body;

    if (!client_name || !database_name || !domain_user || !password) {
      res.status(400);
      throw new Error('client_name, database_name, domain_user and password are required');
    }

    const normalizedDbName = database_name.trim().toLowerCase();
    const templateDbName = (process.env.TENANT_TEMPLATE_DB || 'erp_template').trim().toLowerCase();

    const cloneResult = await cloneTemplateSchema(templateDbName, normalizedDbName);

    const existing = await MasterClient.findOne({
      $or: [{ domain_user: normalizeLogin(domain_user) }, { database_name: normalizedDbName }],
    });

    if (existing) {
      res.status(400);
      throw new Error('Master client with domain_user or database_name already exists');
    }

    const masterClient = await MasterClient.create({
      client_name,
      database_name: normalizedDbName,
      domain_user: normalizeLogin(domain_user),
      password,
      status: status || 'active',
    });

    await runWithTenant(normalizedDbName, async () => {
      const existingUser = await User.findOne({ email: normalizeLogin(domain_user) });
      if (!existingUser) {
        await User.create({
          name: `${client_name} Admin`,
          username: normalizeLogin(domain_user),
          email: normalizeLogin(domain_user),
          password,
          role: 'admin',
        });
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: masterClient._id,
        client_name: masterClient.client_name,
        database_name: masterClient.database_name,
        domain_user: masterClient.domain_user,
        status: masterClient.status,
        template: cloneResult.templateDbName,
      },
      message: 'Client database provisioned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

const me = async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400);
      throw new Error('oldPassword and newPassword are required');
    }

    const user = await User.findById(req.user._id);
    if (!user || !(await user.matchPassword(oldPassword))) {
      res.status(400);
      throw new Error('Old password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = name || user.name;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const setupSecurityQuestion = async (req, res, next) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      res.status(400);
      throw new Error('question and answer are required');
    }

    const loginId = normalizeLogin(req.user.email);
    let masterClient = await MasterClient.findOne({ domain_user: loginId });

    // Backward compatibility:
    // Legacy/admin users may not have a matching domain_user in master records.
    // In that case, resolve the active master profile by current tenant DB.
    if (!masterClient && req.tenantDbName) {
      masterClient = await MasterClient.findOne({
        database_name: String(req.tenantDbName).toLowerCase(),
        status: 'active',
      });
    }

    if (!masterClient) {
      res.status(404);
      throw new Error('Admin profile not found in master records');
    }

    masterClient.securityQuestion = question;
    masterClient.securityAnswer = answer.trim().toLowerCase();

    await masterClient.save();

    res.json({
      success: true,
      message: 'Security question setup successfully',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPasswordQuestion = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const loginId = normalizeLogin(email);
    const masterClient = await MasterClient.findOne({
      domain_user: loginId,
      status: 'active',
    });

    if (!masterClient) {
      res.status(404);
      throw new Error('Account not found');
    }

    if (!masterClient.securityQuestion) {
      res.status(400);
      throw new Error('Security question not configured for this account. Please contact system administrator.');
    }

    res.json({
      success: true,
      data: {
        question: masterClient.securityQuestion
      }
    });

  } catch (error) {
    next(error);
  }
};

const forgotPasswordVerify = async (req, res, next) => {
  try {
    const { email, answer } = req.body;

    if (!email || !answer) {
      res.status(400);
      throw new Error('Email and answer are required');
    }

    const loginId = normalizeLogin(email);
    const masterClient = await MasterClient.findOne({
      domain_user: loginId,
      status: 'active',
    });

    if (!masterClient) {
      res.status(404);
      throw new Error('Account not found');
    }

    const normalizedAnswer = answer.trim().toLowerCase();
    const isAnswerValid = await masterClient.matchSecurityAnswer(normalizedAnswer);

    if (!isAnswerValid) {
      res.status(401);
      throw new Error('Invalid answer');
    }

    // Generate a short-lived reset token (15 mins) specifically for Password Reset Phase
    const secret = process.env.JWT_SECRET || 'change-me-in-env';
    const resetToken = jwt.sign(
      { domainUser: masterClient.domain_user, intent: 'password_reset' },
      secret,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: {
        resetToken
      }
    });

  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      res.status(400);
      throw new Error('Reset token and new password are required');
    }

    const secret = process.env.JWT_SECRET || 'change-me-in-env';
    let decoded;

    try {
      decoded = jwt.verify(resetToken, secret);
    } catch (err) {
      res.status(401);
      throw new Error('Invalid or expired reset token');
    }

    if (decoded.intent !== 'password_reset') {
      res.status(401);
      throw new Error('Invalid token intent');
    }

    const masterClient = await MasterClient.findOne({
      domain_user: decoded.domainUser,
      status: 'active',
    });

    if (!masterClient) {
      res.status(404);
      throw new Error('Account not found');
    }

    // Update Master Client password
    masterClient.password = newPassword;
    await masterClient.save();

    // Propagate change into the isolated Tenant DB User record
    await runWithTenant(masterClient.database_name, async () => {
      const tenantUser = await User.findOne({ email: decoded.domainUser });
      if (tenantUser) {
        tenantUser.password = newPassword;
        await tenantUser.save();
      }
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  provisionClientDatabase,
  logout,
  me,
  changePassword,
  updateProfile,
  setupSecurityQuestion,
  forgotPasswordQuestion,
  forgotPasswordVerify,
  resetPassword
};
