const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatController = require('../controllers/chatController');

router.post('/send', authMiddleware, chatController.sendMessage);

module.exports = router;