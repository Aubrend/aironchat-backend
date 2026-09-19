const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const documentController = require('../controllers/documentController');

// Upload e extração de texto
router.post('/upload', authMiddleware, documentController.upload);

module.exports = router;