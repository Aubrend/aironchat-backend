const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const codeController = require('../controllers/codeController');

router.post('/generate', authMiddleware, codeController.generateCode);

module.exports = router;