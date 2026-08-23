const Conversation = require('../models/Conversation');

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.userId }).sort({ updatedAt: -1 });
    res.json({ conversations });
  } catch (error) {
    console.error('Erro ao listar conversas:', error.stack);
    res.status(500).json({ error: 'Erro ao listar conversas', detail: error.message });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const { title = 'Nova Conversa' } = req.body;
    const conversation = new Conversation({ user: req.userId, title });
    await conversation.save();
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
    if (messages !== undefined) updates.messages = messages;
    const conversation = await Conversation.findOneAndUpdate(
      { _id: id, user: req.userId },
      updates,
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
    res.json({ conversation });
  } catch (error) {
    console.error('Erro ao atualizar conversa:', error.stack);
    res.status(500).json({ error: 'Erro ao atualizar conversa', detail: error.message });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Eliminando conversa ID:', id, 'user:', req.userId);
    const conversation = await Conversation.findOneAndDelete({ _id: id, user: req.userId });
    if (!conversation) {
      return res.status(404).json({ error: 'Conversa não encontrada' });
    }
    console.log('Conversa eliminada:', id);
    res.json({ message: 'Conversa eliminada' });
  } catch (error) {
    console.error('Erro ao eliminar conversa:', error.stack);
    res.status(500).json({ error: 'Erro ao eliminar conversa', detail: error.message });
  }
};