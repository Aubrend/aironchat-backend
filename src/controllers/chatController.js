const Conversation = require('../models/Conversation');
const Setting = require('../models/Setting');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

const getGroqApiKey = async () => {
  try {
    const settings = await Setting.findOne();
    if (settings && settings.groq_api_key) {
      console.log('Usando chave da Groq do banco');
      return settings.groq_api_key;
    }
  } catch (error) {
    console.error('Erro ao buscar chave no banco:', error.message);
  }
  console.log('Usando chave da Groq do ambiente');
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
      if (!conversation) {
        conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
      }
    } else {
      conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    }

    const userMessage = { role: 'user', content: message.content, attachments: message.attachments || [], timestamp: Date.now() };
    conversation.messages.push(userMessage);
    await conversation.save();

    let aiReply;
    try {
      const apiKey = await getGroqApiKey();
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      console.log('Chave da Groq encontrada, chamando IA...');
      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      aiReply = await sendMessageToGroq(messagesToSend, getSystemPrompt(), apiKey);
      console.log('Resposta da Groq recebida');
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    const assistantMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error.message);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};