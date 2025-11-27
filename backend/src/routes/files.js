const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.get('/', fileController.list);
router.post('/upload', fileController.upload);
router.get('/download', fileController.download);
router.post('/mkdir', fileController.mkdir);
router.post('/rename', fileController.rename);
router.post('/delete', fileController.remove);

module.exports = router;
