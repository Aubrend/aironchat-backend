const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');
const { sanitizeResponse } = require('../utils/sanitize');

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) return res.status(400).json({ error: 'Mensagem vazia' });

    console.log('Conversation ID recebido:', conversationId);

    // Buscar ou criar conversa
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findConversationByIdAndUser(conversationId, req.userId);
      if (!conversation) {
        conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
      } else {
        // Garantir que messages é array
        if (!Array.isArray(conversation.messages)) {
          conversation.messages = [];
        }
        console.log('Histórico carregado:', conversation.messages.length, 'mensagens');
      }
    } else {
      conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
    }

    // Adicionar mensagem do utilizador
    const userMessage = {
      role: 'user',
      content: message.content,
      attachments: message.attachments || [],
      timestamp: Date.now(),
    };
    conversation.messages.push(userMessage);

    // Guardar mensagem do utilizador antes de chamar IA
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    console.log('Total de mensagens após adicionar user:', conversation.messages.length);

    // Preparar histórico para envio (remover anexos para simplicidade)
    const historyToSend = conversation.messages
      .filter(m => !m.attachments || m.attachments.length === 0)
      .map(m => ({ role: m.role, content: m.content }));

    console.log('Mensagens enviadas à IA:', JSON.stringify(historyToSend.slice(-5)));

    let aiReply;
    try {
      const user = await User.findUserById(req.userId);
      const userMemory = user?.memory || '';
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      const prompt = `${getSystemPrompt()}\n\nUSER MEMORY:\n${userMemory}\n\nCONVERSATION HISTORY:\n`;
      // Incluir todo o histórico no prompt de sistema (alternativa)
      const fullPrompt = prompt + historyToSend.map(m => `${m.role}: ${m.content}`).join('\n');
      aiReply = await sendMessageToGroq(historyToSend, fullPrompt, apiKey);
      console.log('Resposta da Groq recebida');
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    // Limpar resposta
    aiReply = sanitizeResponse(aiReply);

    const assistantMessage = {
      role: 'assistant',
      content: aiReply,
      timestamp: Date.now(),
    };
    conversation.messages.push(assistantMessage);

    // Guardar resposta do assistente
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    console.log('Conversa atualizada com resposta. Total:', conversation.messages.length);

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error.stack);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};