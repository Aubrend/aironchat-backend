const Conversation = require('../models/Conversation');
const Setting = require('../models/Setting');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');
const { validationResult } = require('express-validator');

const getGroqApiKey = async () => {
  const settings = await Setting.findOne();
  if (settings && settings.groq_api_key) {
    console.log('Usando chave da Groq do banco de dados');
    return settings.groq_api_key;
  }
  console.log('Usando chave da Groq do ambiente');
  return process.env.GROQ_API_KEY;
};

exports.sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erro de validação no chat:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { conversationId, message } = req.body;
    console.log('Recebida mensagem:', { conversationId, content: message?.content?.slice(0, 50) });

    if (!message || !message.content) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    let conversation;
    if (conversationId) {
      console.log('Buscando conversa existente:', conversationId);
      conversation = await Conversation.findOne({ _id: conversationId, user: req.userId });
      if (!conversation) {
        console.log('Conversa não encontrada, criando nova');
        conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
      }
    } else {
      console.log('Criando nova conversa');
      conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    }

    const userMessage = {
      role: 'user',
      content: message.content,
      attachments: message.attachments || [],
      timestamp: Date.now(),
    };
    conversation.messages.push(userMessage);
    await conversation.save();
    console.log('Mensagem do utilizador guardada. Total mensagens:', conversation.messages.length);

    let aiReply;
    let usedFallback = false;
    try {
      const apiKey = await getGroqApiKey();
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      console.log('Chave da Groq encontrada, chamando IA...');
      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      aiReply = await sendMessageToGroq(messagesToSend, getSystemPrompt(), apiKey);
      console.log('Resposta da Groq recebida:', aiReply.slice(0, 50));
    } catch (error) {
      console.error('Erro ao chamar Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
      usedFallback = true;
      console.log('Resposta local:', aiReply.slice(0, 50));
    }

    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
      usedFallback,
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();
    console.log('Resposta do assistente guardada.');

    res.json({
      conversation,
      reply: assistantMessage,
    });
  } catch (error) {
    console.error('Erro geral no chat:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};