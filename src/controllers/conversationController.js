const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findConversationsByUser(req.userId);
    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title = 'Nova Conversa' } = req.body;
    const conversation = await Conversation.createConversation(req.userId, title);
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar conversa' });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, messages } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (messages !== undefined) updates.messages = messages;
    const conversation = await Conversation.updateConversation(id, req.userId, updates);
    if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    await Conversation.deleteConversation(id, req.userId);
    res.json({ message: 'Conversa eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar conversa' });
  }
};