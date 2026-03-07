const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

router.get('/', warehouseController.listWarehouses);
router.post('/', warehouseController.createWarehouse);
router.post('/manual-entry', warehouseController.addManualEntry);
router.get('/:id', warehouseController.getWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
