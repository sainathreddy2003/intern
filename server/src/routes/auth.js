const express = require('express');
const {
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
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/provision-client', protect, provisionClientDatabase);
router.post('/logout', logout);
router.get('/me', protect, me);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

// Security Question Auth flows
router.post('/setup-security-question', protect, setupSecurityQuestion);
router.post('/forgot-password-question', forgotPasswordQuestion);
router.post('/forgot-password-verify', forgotPasswordVerify);
router.post('/reset-password', resetPassword);

module.exports = router;
