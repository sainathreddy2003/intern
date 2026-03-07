const express = require('express');
const {
  searchCustomers,
  getCustomerByCode,
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customersController');

const router = express.Router();

router.get('/search', searchCustomers);
router.get('/by-code/:code', getCustomerByCode);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
