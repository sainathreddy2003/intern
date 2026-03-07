const express = require('express');
const {
  getStock,
  getLedger,
  adjustStock,
  getBatches,
  getLowStock,
  getExpiring
} = require('../controllers/inventoryController');

const router = express.Router();

router.get('/stock', getStock);
router.get('/ledger', getLedger);
router.post('/adjust', adjustStock);
router.get('/batches/:itemId', getBatches);
router.get('/low-stock', getLowStock);
router.get('/expiring', getExpiring);

module.exports = router;
