const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendMessageToGroq, getSystemPrompt } = require('../utils/groq');
const { getLocalResponse } = require('../utils/localAI');
const { sanitizeResponse } = require('../utils/sanitize');

const extractMemoryFacts = (content) => {
  const facts = [];
  const lower = content.toLowerCase();
  if (lower.includes('meu nome ÃƒÂ©') || lower.includes('chamo-me')) {
    const match = content.match(/meu nome ÃƒÂ©\s+([^,\.]+)|chamo-me\s+([^,\.]+)/i);
    if (match) facts.push(`Nome do utilizador: ${match[1] || match[2]}`);
  }
  if (lower.includes('gosto de') || lower.includes('prefiro')) {
    facts.push(`PreferÃƒÂªncia: ${content}`);
  }
  return facts;
};

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

    if (!Array.isArray(conversation.messages)) conversation.messages = [];

    const userMessage = { role: 'user', content: message.content, attachments: message.attachments || [], timestamp: Date.now() };
    conversation.messages.push(userMessage);

    // Atualizar tÃƒÂ­tulo se for a primeira mensagem e o tÃƒÂ­tulo ainda for "Nova Conversa"
    if (conversation.messages.length === 1) {
      conversation.title = message.content.slice(0, 30);
    }

    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages, title: conversation.title });

    // Extrair memÃƒÂ³ria
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
      if (!apiKey) throw new Error('Chave da Groq nÃƒÂ£o configurada');
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
    await Conversation.updateConversation(conversation.id, req.userId, { messages: conversation.messages, title: conversation.title });

    // Garantir que a resposta inclui title
    res.json({ conversation, reply: assistantMessage });
  } catch (error) {
    console.error('Erro geral no chat:', error);
    res.status(500).json({ error: 'Erro ao processar mensagem' });
  }
};

// ═══════════════════════════════════════════════════════════
// generatePdfContent — Gera JSON estruturado para PDF
// ═══════════════════════════════════════════════════════════
exports.generatePdfContent = async (req, res) => {
  try {
    const { messages, instruction } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensagens obrigatórias' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

    const systemPrompt = `És o AironChat e vais preparar conteúdo estruturado para um PDF profissional.

Devolve SEMPRE um objeto JSON válido com este formato exato:
{
  "title": "Título curto e descritivo do documento",
  "subtitle": "Subtítulo opcional (pode ficar vazio)",
  "sections": [
    { "heading": "Nome da secção", "body": "Parágrafo de texto simples. Podes usar \\n para quebras de linha e '- ' para itens de lista." }
  ]
}

Regras OBRIGATÓRIAS:
- Devolve APENAS o JSON, sem texto antes ou depois, sem markdown, sem fences.
- O JSON tem de ser parseável diretamente.
- Nada de asteriscos (*), cardinal (#) nem barras invertidas estranhas.
- Escreve em português de Portugal, tom profissional e claro.
- Entre 3 e 6 secções bem organizadas.
- Se o pedido for resumo, cria uma secção "Resumo" e outra "Conclusões".
- Não inventes factos que não estejam na conversa.`;

    const userPrompt = `Instrução do utilizador: ${instruction || 'Gera um resumo completo desta conversa.'}

--- CONVERSA ---
${messages
  .map(m => `${m.role === 'user' ? 'Utilizador' : 'Airon'}: ${String(m.content || '').slice(0, 4000)}`)
  .join('\n\n')}
--- FIM ---`;

    const { sendMessageToGroq } = require('../utils/groq');
    const raw = await sendMessageToGroq(
      [{ role: 'user', content: userPrompt }],
      systemPrompt,
      apiKey
    );

    let cleaned = String(raw).trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('IA devolveu resposta inválida');
      parsed = JSON.parse(match[0]);
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sections)) {
      throw new Error('Estrutura JSON inválida');
    }

    parsed.title = String(parsed.title || 'Documento AironChat').slice(0, 200);
    parsed.subtitle = String(parsed.subtitle || '').slice(0, 300);
    parsed.sections = parsed.sections.slice(0, 20).map(s => ({
      heading: String(s.heading || '').slice(0, 200),
      body: String(s.body || '').slice(0, 8000),
    }));

    res.json(parsed);
  } catch (error) {
    console.error('Erro generatePdfContent:', error.message);
    res.status(500).json({ error: 'Erro ao gerar conteúdo do PDF' });
  }
};