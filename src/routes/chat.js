const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatController = require('../controllers/chatController');

const chatValidation = [
  body('message.content').trim().notEmpty().withMessage('Mensagem vazia'),
];

router.post('/send', authMiddleware, chatValidation, chatController.sendMessage);

module.exports = router;