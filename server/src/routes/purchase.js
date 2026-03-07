const express = require('express');
const {
  listPurchases,
  createPurchase,
  listActiveSuppliers,
  getPurchase,
  updatePurchase,
  addPurchasePayment,
  deletePurchase
} = require('../controllers/purchaseController');

const router = express.Router();

router.get('/', listPurchases);
router.post('/', createPurchase);
router.get('/suppliers/all', listActiveSuppliers);
router.get('/:id', getPurchase);
router.put('/:id', updatePurchase);
router.put('/:id/payment', addPurchasePayment);
router.delete('/:id', deletePurchase);

module.exports = router;
