const express = require('express');
const multer = require('multer');
const {
  listPurchases,
  createPurchase,
  listActiveSuppliers,
  getPurchase,
  updatePurchase,
  addPurchasePayment,
  deletePurchase
} = require('../controllers/purchaseController');
const uploadPurchaseBill = require('../config/multerPurchase');

const router = express.Router();

const purchaseUploadHandler = (req, res, next) => {
  uploadPurchaseBill.single('billAttachment')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ success: false, message: 'Attachment size must be at most 5MB' });
      return;
    }
    res.status(400).json({ success: false, message: error.message || 'Invalid attachment upload' });
  });
};

router.get('/', listPurchases);
router.post('/', purchaseUploadHandler, createPurchase);
router.post('/create', purchaseUploadHandler, createPurchase);
router.get('/suppliers/all', listActiveSuppliers);
router.get('/:id', getPurchase);
router.put('/:id', purchaseUploadHandler, updatePurchase);
router.put('/:id/payment', addPurchasePayment);
router.delete('/:id', deletePurchase);

module.exports = router;
