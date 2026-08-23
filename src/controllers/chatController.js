const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

const buildPastContext = async (userId, currentConversationId) => {
  try {
    const conversations = await Conversation.find({ user: userId }).sort({ updatedAt: -1 }).limit(10);
    let context = '';
    for (const conv of conversations) {
      if (conv._id.toString() === currentConversationId) continue;
      const lastMessages = conv.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
      if (lastMessages) context += `Conversa "${conv.title}":\n${lastMessages}\n\n`;
    }
    return context || 'Sem conversas anteriores.';
  } catch (error) {
    return '';
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) return res.status(400).json({ error: 'Mensagem vazia' });

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: req.userId });
      if (!conversation) conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    } else {
      conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    }

    const userMessage = { role: 'user', content: message.content, attachments: message.attachments || [], timestamp: Date.now() };
    conversation.messages.push(userMessage);
    await conversation.save();

    let aiReply;
    try {
      const user = await User.findById(req.userId);
      const userMemory = user?.memory || '';
      const pastContext = await buildPastContext(req.userId, conversation._id);
      const enhancedPrompt = `${getSystemPrompt()}\n\nUSER MEMORY:\n${userMemory}\n\nPAST CONVERSATIONS CONTEXT:\n${pastContext}`;
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      const messagesToSend = conversation.messages.filter(m => !m.attachments || m.attachments.length === 0).map(m => ({ role: m.role, content: m.content }));
      aiReply = await sendMessageToGroq(messagesToSend, enhancedPrompt, apiKey);
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    const assistantMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};