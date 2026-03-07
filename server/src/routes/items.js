const express = require('express');
const {
  getGroups,
  getUnits,
  getTaxRates,
  searchItems,
  getItemByBarcode,
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/itemsController');

const router = express.Router();

router.get('/groups/all', getGroups);
router.get('/units/all', getUnits);
router.get('/tax/all', getTaxRates);
router.get('/search', searchItems);
router.get('/by-barcode/:barcode', getItemByBarcode);
router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', createItem);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
