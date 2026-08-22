const Conversation = require('../models/Conversation');
const { sendMessageToGroq } = require('../utils/groq');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: req.userId });
      if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada' });
    } else {
      conversation = new Conversation({
        user: req.userId,
        title: message.content.slice(0, 30),
      });
    }

    const userMessage = {
      role: 'user',
      content: message.content,
      attachments: message.attachments || [],
      timestamp: Date.now(),
    };
    conversation.messages.push(userMessage);
    await conversation.save();

    let aiReply;
    try {
      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      aiReply = await sendMessageToGroq(messagesToSend, 'You are AironChat, a helpful coding assistant.');
    } catch (error) {
      console.error('Erro ao chamar Groq:', error);
      aiReply = 'Desculpe, ocorreu um erro ao processar sua mensagem.';
    }

    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.json({
      conversation,
      reply: assistantMessage,
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};