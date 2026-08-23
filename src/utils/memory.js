const natural = require('natural');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

// Função para resumir um texto usando Groq
const summarizeText = async (text, apiKey) => {
  if (!apiKey) return '';
  const axios = require('axios');
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'groq/compound',
        messages: [
          { role: 'system', content: 'Summarize the following text in a concise paragraph, highlighting key topics and important details.' },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Erro ao resumir texto:', error.message);
    return '';
  }
};

// Extrai tópicos importantes de uma conversa
const extractTopics = async (messages) => {
  const text = messages.map(m => m.content).join('\n');
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const stopwords = new Set(['a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'que', 'eu', 'voce', 'ele', 'ela', 'nos', 'eles', 'elas', 'um', 'uma', 'os', 'as', 'nao', 'sim', 'porque', 'como', 'quando', 'onde', 'qual', 'quais', 'meu', 'minha', 'seu', 'sua', 'nosso', 'nossa', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her', 'was', 'one', 'our', 'out', 'has', 'have', 'been', 'this', 'that', 'with', 'from']);
  const freq = {};
  tokens.forEach(token => {
    if (token.length > 3 && !stopwords.has(token)) {
      freq[token] = (freq[token] || 0) + 1;
    }
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 5).map(([word]) => word);
};

// Salvar memória de uma conversa
const saveConversationMemory = async (userId, conversationId) => {
  try {
    const conversation = await Conversation.findById(conversationId).populate('user');
    if (!conversation || conversation.messages.length < 2) return null;

    const user = await User.findById(userId);
    if (!user) return null;

    const apiKey = process.env.GROQ_API_KEY;
    const summaryText = conversation.messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const summary = await summarizeText(summaryText, apiKey);
    const topics = await extractTopics(conversation.messages);

    const memoryChunk = {
      topic: topics.join(', '),
      summary: summary || conversation.messages.slice(0, 5).map(m => m.content).join(' '),
      importantPoints: topics,
      sourceConversationId: conversationId,
    };

    user.memoryChunks.push(memoryChunk);
    // Manter no máximo 20 chunks de memória
    if (user.memoryChunks.length > 20) {
      user.memoryChunks = user.memoryChunks.slice(-20);
    }
    await user.save();
    return memoryChunk;
  } catch (error) {
    console.error('Erro ao salvar memória:', error);
    return null;
  }
};

// Recuperar memória relevante
const getRelevantMemory = async (userId, query, currentConversationId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.memoryChunks || user.memoryChunks.length === 0) return '';

    const tokenizer = new natural.WordTokenizer();
    const queryTokens = tokenizer.tokenize(query.toLowerCase()).filter(t => t.length > 3);

    // Pontuação simples de relevância
    const scoredChunks = user.memoryChunks.map(chunk => {
      const chunkText = `${chunk.topic} ${chunk.summary}`.toLowerCase();
      let score = 0;
      queryTokens.forEach(token => {
        if (chunkText.includes(token)) score++;
      });
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const relevant = scoredChunks.filter(item => item.score > 0).slice(0, 3).map(item => item.chunk);
    if (relevant.length === 0) return '';

    return relevant.map(chunk => `Topic: ${chunk.topic}\nSummary: ${chunk.summary}\nKey points: ${chunk.importantPoints.join(', ')}`).join('\n---\n');
  } catch (error) {
    console.error('Erro ao recuperar memória:', error);
    return '';
  }
};

module.exports = { saveConversationMemory, getRelevantMemory };