const express = require('express');
const router = express.Router();
const { processReturn, getReturns } = require('../controllers/returnController');

// Add a new return
router.post('/', processReturn);

// Fetch a list of returns (optionally by platform or warehouse)
router.get('/', getReturns);

module.exports = router;
