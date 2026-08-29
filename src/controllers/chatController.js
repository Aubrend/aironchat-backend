const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');
const { sanitizeResponse } = require('../utils/sanitize');

// Função para extrair informações simples da mensagem do utilizador
const extractMemoryFacts = (content) => {
  const facts = [];
  const lower = content.toLowerCase();

  // Exemplo: detetar preferências
  if (lower.includes('meu nome é') || lower.includes('chamo-me')) {
    const match = content.match(/meu nome é\s+([^,\.]+)|chamo-me\s+([^,\.]+)/i);
    if (match) facts.push(`Nome do utilizador: ${match[1] || match[2]}`);
  }
  if (lower.includes('gosto de') || lower.includes('prefiro')) {
    facts.push(`Preferência: ${content}`);
  }
  if (lower.includes('trabalho com') || lower.includes('sou desenvolvedor')) {
    facts.push(`Profissão: ${content}`);
  }
  // Pode ser estendido com mais regras

  return facts;
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || !message.content) return res.status(400).json({ error: 'Mensagem vazia' });

    // Buscar ou criar conversa
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findConversationByIdAndUser(conversationId, req.userId);
      if (!conversation) conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
    } else {
      conversation = await Conversation.createConversation(req.userId, message.content.slice(0, 30));
    }

    if (!Array.isArray(conversation.messages)) conversation.messages = [];

    const userMessage = { role: 'user', content: message.content, attachments: message.attachments || [], timestamp: Date.now() };
    conversation.messages.push(userMessage);
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    // Carregar memória persistente do utilizador
    const user = await User.findUserById(req.userId);
    let memory = user?.memory || '';
    const facts = extractMemoryFacts(message.content);
    if (facts.length > 0) {
      memory = memory + '\n' + facts.join('\n');
      await User.updateUser(req.userId, { memory });
    }

    let aiReply;
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('Chave da Groq não configurada');
      const historyToSend = conversation.messages
        .filter(m => !m.attachments || m.attachments.length === 0)
        .map(m => ({ role: m.role, content: m.content }));
      const prompt = `${getSystemPrompt()}\n\nUSER MEMORY:\n${memory}\n\nCONVERSATION HISTORY:\n` + historyToSend.map(m => `${m.role}: ${m.content}`).join('\n');
      aiReply = await sendMessageToGroq(historyToSend, prompt, apiKey);
    } catch (error) {
      console.error('Erro na Groq, usando fallback local:', error.message);
      aiReply = getLocalResponse(message.content);
    }

    aiReply = sanitizeResponse(aiReply);

    const assistantMessage = { role: 'assistant', content: aiReply, timestamp: Date.now() };
    conversation.messages.push(assistantMessage);
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages });

    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};