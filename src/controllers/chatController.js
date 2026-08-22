const Conversation = require('../models/Conversation');
const Setting = require('../models/Setting');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

// Função para obter chave da Groq do banco ou variável de ambiente
const getGroqApiKey = async () => {
  const settings = await Setting.findOne();
  if (settings && settings.groq_api_key) {
    return settings.groq_api_key;
  }
  return process.env.GROQ_API_KEY;
};

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
    let usedFallback = false;

    try {
      const apiKey = await getGroqApiKey();
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      aiReply = await sendMessageToGroq(messagesToSend, getSystemPrompt(), apiKey);
    } catch (error) {
      console.error('Erro ao chamar Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
      usedFallback = true;
    }

    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
      usedFallback,
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};