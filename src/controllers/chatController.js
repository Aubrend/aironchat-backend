const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');

// Função para construir contexto de conversas passadas relevantes
const buildPastContext = async (userId, currentQuery, currentConversationId) => {
  try {
    const conversations = await Conversation.find({ user: userId }).sort({ updatedAt: -1 }).limit(10);
    let context = '';
    for (const conv of conversations) {
      if (conv._id.toString() === currentConversationId) continue; // ignora a conversa atual
      // Extrair título e últimas mensagens
      const lastMessages = conv.messages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n');
      if (lastMessages) {
        context += `Conversa "${conv.title}" (${new Date(conv.updatedAt).toLocaleString()}):\n${lastMessages}\n\n`;
      }
    }
    return context || 'Sem conversas anteriores.';
  } catch (error) {
    console.error('Erro ao construir contexto:', error);
    return '';
  }
};

// Função para extrair preferências do utilizador (memory)
const getUserMemory = async (userId) => {
  const user = await User.findById(userId);
  return user && user.memory ? user.memory : '';
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
      if (!conversation) conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    } else {
      conversation = new Conversation({ user: req.userId, title: message.content.slice(0, 30) });
    }

    const userMessage = { role: 'user', content: message.content, attachments: message.attachments || [], timestamp: Date.now() };
    conversation.messages.push(userMessage);
    await conversation.save();

    let aiReply;
    try {
      // Obter memória do utilizador e contexto de conversas passadas
      const userMemory = await getUserMemory(req.userId);
      const pastContext = await buildPastContext(req.userId, message.content, conversation._id);

      // System prompt enriquecido
      const enhancedPrompt = `${getSystemPrompt()}\n\nUSER MEMORY:\n${userMemory || 'Nenhuma informação armazenada ainda.'}\n\nPAST CONVERSATIONS CONTEXT:\n${pastContext}`;

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');

      const messagesToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));

      aiReply = await sendMessageToGroq(messagesToSend, enhancedPrompt, apiKey);
      console.log('Resposta da Groq com memória recebida');
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    const assistantMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
    conversation.messages.push(assistantMessage);
    await conversation.save();

    // Atualizar memória do utilizador (simples: armazenar preferências mencionadas)
    // Pode ser melhorado com análise de sentimentos ou extração de entidades; por agora, salvar primeiras 500 caracteres de cada resposta para histórico.
    try {
      await User.updateOne(
        { _id: req.userId },
        { $set: { memory: (userMemory ? userMemory + '\n' : '') + `User said: ${message.content.slice(0, 200)}` } }
      );
    } catch (memErr) {
      console.error('Erro ao atualizar memória:', memErr);
    }

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error.message);
    res.status(500).json({ error: 'Erro ao processar mensagem', detail: error.message });
  }
};