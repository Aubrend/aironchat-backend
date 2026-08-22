const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.userId }).sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao listar conversas:', error);
    res.status(500).json({ error: 'Erro ao listar conversas' });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title = 'Nova Conversa' } = req.body;
    const conversation = new Conversation({ user: req.userId, title });
    await conversation.save();
    res.status(201).json({ conversation });
  } catch (error) {
    console.error('Erro ao criar conversa:', error);
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
    const conversation = await Conversation.findByIdAndUpdate(id, updates, { new: true });
    if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
    res.json({ conversation });
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error);
    res.status(500).json({ error: 'Erro ao atualizar conversa' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    await Conversation.findByIdAndDelete(id);
    res.json({ message: 'Conversa eliminada' });
  } catch (error) {
    console.error('Erro ao eliminar conversa:', error);
    res.status(500).json({ error: 'Erro ao eliminar conversa' });
  }
};