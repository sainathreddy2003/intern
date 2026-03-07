const express = require('express');
const {
  searchSuppliers,
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/suppliersController');

const router = express.Router();

router.get('/search', searchSuppliers);
router.get('/', listSuppliers);
router.get('/:id', getSupplier);
router.post('/', createSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
