const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Enviar mensagem para a IA
router.post('/send', authMiddleware, chatController.sendMessage);

// Gerar conteúdo estruturado para PDF
router.post('/generate-pdf', authMiddleware, chatController.generatePdfContent);

module.exports = router;