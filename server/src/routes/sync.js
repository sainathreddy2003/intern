const express = require('express');
const { getStatus, downloadMaster, uploadData, getQueue, clearQueue } = require('../controllers/syncController');

const router = express.Router();

router.get('/status', getStatus);
router.get('/download/master', downloadMaster);
router.post('/upload', uploadData);
router.get('/queue', getQueue);
router.delete('/queue', clearQueue);

module.exports = router;
