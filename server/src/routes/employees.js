const express = require('express');
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  getEmployeeStats
} = require('../controllers/employeesController');

const router = express.Router();

router.get('/', getEmployees);
router.get('/stats', getEmployeeStats);
router.get('/departments', getDepartments);
router.get('/:id', getEmployee);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
