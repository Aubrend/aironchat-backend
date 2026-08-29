const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findConversationsByUser(req.userId);
    // Garantir que messages é array
    conversations.forEach(c => {
      if (!Array.isArray(c.messages)) c.messages = [];
    });
    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao listar conversas:', error.stack);
    res.status(500).json({ error: 'Erro ao listar conversas', detail: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title = 'Nova Conversa' } = req.body;
    const conversation = await Conversation.createConversation(req.userId, title);
    // Garantir messages array na resposta
    conversation.messages = [];
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Erro ao criar conversa:', error.stack);
    res.status(500).json({ error: 'Erro ao criar conversa', detail: error.message });
  }
};

exports.updateConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, messages } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (messages !== undefined) updates.messages = Array.isArray(messages) ? messages : [];
    const conversation = await Conversation.updateConversation(id, req.userId, updates);
    if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    res.json({ conversation });
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error.stack);
    res.status(500).json({ error: 'Erro ao atualizar conversa', detail: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Eliminando conversa:', id);
    await Conversation.deleteConversation(id, req.userId);
    res.json({ message: 'Conversa eliminada' });
  } catch (error) {
    console.error('Erro ao eliminar conversa:', error.stack);
    res.status(500).json({ error: 'Erro ao eliminar conversa', detail: error.message });
  }
};