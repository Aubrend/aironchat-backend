const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');
const { saveConversationMemory, getRelevantMemory } = require('../utils/memory');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

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
      const relevantMemory = await getRelevantMemory(req.userId, message.content, conversation._id);

      const enhancedPrompt = `${getSystemPrompt()}\n\nRELEVANT PAST MEMORIES:\n${relevantMemory || 'No relevant memories.'}`;

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');

      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));

      aiReply = await sendMessageToGroq(messagesToSend, enhancedPrompt, apiKey);
      console.log('Resposta da Groq com memória avançada recebida');
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    const assistantMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    // Salvar memória da conversa quando houver pelo menos 2 mensagens
    if (conversation.messages.length >= 4) {
      await saveConversationMemory(req.userId, conversation._id);
    }

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error.message);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};