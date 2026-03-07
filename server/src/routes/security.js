const express = require('express');
const {
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
} = require('../controllers/securityController');

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/audit-logs', getAuditLogs);
router.get('/sessions', getSessions);
router.get('/failed-logins', getFailedLogins);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/roles/:roleId/permissions', getRolePermissions);
router.put('/roles/:roleId/permissions', updateRolePermissions);
router.post('/sessions/:sessionId/terminate', terminateSession);
router.post('/users/:userId/unlock', unlockUser);

module.exports = router;
