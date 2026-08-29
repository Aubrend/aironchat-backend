const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) return res.status(400).json({ error: 'Mensagem vazia' });

    // Buscar ou criar conversa
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findConversationByIdAndUser(conversationId, req.userId);
      if (!conversation) {
        conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
      }
    } else {
      conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
    }

    // Garantir que messages é array
    if (!Array.isArray(conversation.messages)) {
      conversation.messages = [];
    }

    // Adicionar mensagem do usuário
    const userMessage = {
      role: 'user',
      content: message.content,
      attachments: message.attachments || [],
      timestamp: Date.now(),
    };
    conversation.messages.push(userMessage);
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    // Gerar resposta
    let aiReply;
    try {
      const user = await User.findUserById(req.userId);
      const userMemory = user?.memory || '';
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      const prompt = `${getSystemPrompt()}\n\nUSER MEMORY:\n${userMemory}`;
      aiReply = await sendMessageToGroq(messagesToSend, prompt, apiKey);
      console.log('Resposta da Groq recebida');
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    // Adicionar resposta do assistente
    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
    };
    conversation.messages.push(assistantMessage);
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};