const SystemSetting = require('../models/SystemSetting');

const getDashboard = (req, res) => res.json({ success: true, data: {} });
const getAuditLogs = (req, res) => res.json({ success: true, data: [] });
const getSessions = (req, res) => res.json({ success: true, data: [] });
const getFailedLogins = (req, res) => res.json({ success: true, data: [] });

const getSettings = async (req, res, next) => {
  try {
    let settings = await SystemSetting.findOne({ singleton: 'SYSTEM' });
    if (!settings) {
      settings = await SystemSetting.create({ singleton: 'SYSTEM' });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const payload = req.body || {};
    let settings = await SystemSetting.findOne({ singleton: 'SYSTEM' });
    if (!settings) {
      settings = await SystemSetting.create({ singleton: 'SYSTEM' });
    }

    Object.assign(settings, payload);
    await settings.save();

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const getRolePermissions = (req, res) => res.json({ success: true, data: [] });
const updateRolePermissions = (req, res) => res.json({ success: true, data: req.body.permissions || [] });
const terminateSession = (req, res) => res.json({ success: true, message: 'Session terminated' });
const unlockUser = (req, res) => res.json({ success: true, message: 'User unlocked' });

module.exports = {
  getDashboard,
  getAuditLogs,
  getSessions,
  getFailedLogins,
  getSettings,
  updateSettings,
  getRolePermissions,
  updateRolePermissions,
  terminateSession,
  unlockUser
};
