const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const conversationController = require('../controllers/conversationController');

router.use(authMiddleware);
router.get('/', conversationController.getConversations);
router.post('/', conversationController.createConversation);
router.put('/:id', conversationController.updateConversation);
router.delete('/:id', conversationController.deleteConversation);

module.exports = router;