const express = require('express');
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateSalary
} = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);
router.put('/salary', updateSalary);

module.exports = router;
