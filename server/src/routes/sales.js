const express = require('express');
const {
  listSales,
  createSale,
  updateSale,
  updateSalePayment,
  getDayEndSummary,
  getSale,
  holdSale,
  cancelSale,
  deleteSale,
  getPrintableSale
} = require('../controllers/salesController');

const router = express.Router();

router.get('/', listSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.put('/:id/payment', updateSalePayment);
router.get('/day-end/summary', getDayEndSummary);
router.get('/:id', getSale);
router.put('/:id/hold', holdSale);
router.put('/:id/cancel', cancelSale);
router.delete('/:id', deleteSale);
router.get('/:id/print', getPrintableSale);

module.exports = router;
