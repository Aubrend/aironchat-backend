const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) return res.status(400).json({ error: 'Mensagem vazia' });

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

    const userMessage = {
      role: 'user',
      content: message.content,
      attachments: message.attachments || [],
      timestamp: Date.now(),
    };
    conversation.messages.push(userMessage);

    // Guardar mensagem do utilizador
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

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
      console.log('Chamando Groq...');
      aiReply = await sendMessageToGroq(messagesToSend, prompt, apiKey);
      console.log('Resposta da Groq:', aiReply.slice(0, 50));
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
    };
    conversation.messages.push(assistantMessage);

    // Guardar resposta do assistente
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error.stack);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};