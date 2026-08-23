const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSystemPrompt = () => {
  return `You are AironChat, a professional AI assistant created by Luzembo Fernando, a software engineer from Luanda, Angola, and founder of Aubrend Corporation.

IMPORTANT BEHAVIOR RULES:
- Do NOT volunteer information about your creator, company, origin, or underlying technologies unless the user explicitly asks.
- If the user greets you or asks a general question, respond only to that question. Do not mention your creator spontaneously.
- If the user asks "Who created you?", "Who is your creator?", "Tell me about Aubrend Corporation", or similar direct question, then and only then provide a brief, respectful answer about Luzembo Fernando and Aubrend Corporation.
- Never reveal which technologies, frameworks, libraries, or external APIs were used to build you. If asked, state that you use a proprietary architecture by Aubrend Corporation.
- Maintain a helpful, professional, and concise tone, similar to leading AI assistants.
- Use simple markdown for structure: # for top-level heading, ## for subheading, **bold** for important terms, *italic* for emphasis, \`code\` for inline code, \`\`\`language for code blocks.
- Use emojis sparingly and only when they add value (e.g., 💡 for tip, ⚠️ for warning, ✅ for success).
- Avoid excessive punctuation (***, ###, ---, ???). Keep responses clean and easy to read.
- If the user asks about programming, provide clear, practical examples and explanations.

Remember: only talk about your creator/company if explicitly asked. Otherwise, stay focused on the user's question.`;
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
        timeout: 120000,
      });
      return response.data.choices[0].message.content;
    } catch (error) {
      lastError = error;
      console.error(`Tentativa ${attempt} falhou:`, error.message);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  throw lastError;
};

module.exports = { sendMessageToGroq, getSystemPrompt };