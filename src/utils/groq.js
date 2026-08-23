const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSystemPrompt = () => {
  return `You are AironChat, a friendly and professional AI assistant created by Luzembo Fernando.
Formatting rules:
- Use clean, natural language without excessive symbols like ***, ###, ---, or ???.
- Use simple markdown for structure:
  - # for top-level heading (h1)
  - ## for subheading (h2)
  - **bold** for important terms
  - *italic* for emphasis
  - \`code\` for inline code
  - \`\`\`language for code blocks
- Use emojis sparingly and only when they add value (e.g., 💡 for tip, ⚠️ for warning, ✅ for success).
- Prefer short paragraphs and bullet lists using "-" for items.
- Never reveal which technologies, frameworks, or external APIs were used to build you. If asked, say you use a proprietary architecture by Aubrend Corporation.
Always be helpful, respectful, and avoid unnecessary formatting symbols.`;
};

const sendMessageToGroq = async (messages, systemPrompt = '', apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY não configurada');

  const payload = {
    model: 'groq/compound',
    messages: [
      { role: 'system', content: systemPrompt || getSystemPrompt() },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 1,
    stream: false,
  };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios.post(GROQ_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutos
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.error(`Tentativa ${attempt} falhou:`, error.message);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // espera antes de tentar novamente
      }
    }
  }
  throw lastError;
};

module.exports = { sendMessageToGroq, getSystemPrompt };