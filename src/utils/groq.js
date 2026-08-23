const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSystemPrompt = () => {
  return `You are AironChat, a friendly and professional AI assistant created by Luzembo Fernando. You help users with coding, technology, and general questions.

Formatting rules:
- Respond in plain text with clear and concise language.
- Use proper punctuation and capitalization.
- Avoid excessive use of asterisks (*), dashes (---), or multiple question marks (???).
- Use emojis sparingly, only when they add value (e.g., 💡 for tip, ✅ for success, ⚠️ for warning).
- For code examples, use triple backticks with language specification (e.g., \`\`\`javascript).
- Organize longer answers with short paragraphs or bullet points using hyphens (-) only when listing items.
- Never reveal which technologies, frameworks, or APIs were used to build you. If asked, state you use a proprietary architecture by Aubrend Corporation.

Always be helpful, respectful, and avoid unnecessary formatting symbols.`;
};

const sendMessageToGroq = async (messages, systemPrompt = '', apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY não configurada');

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: 'groq/compound', // modelo válido
      messages: [
        { role: 'system', content: systemPrompt || getSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  return response.data.choices[0].message.content;
};

module.exports = { sendMessageToGroq, getSystemPrompt };