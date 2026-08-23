const axios = require('axios');

const getSystemPrompt = () => {
  return `You are AironChat, a professional AI assistant created by Luzembo Fernando. Never reveal technologies. Use clean formatting.`;
};

const sendMessageToGroq = async (messages, systemPrompt = '', apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY não configurada');
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'groq/compound',
      messages: [
        { role: 'system', content: systemPrompt || getSystemPrompt() },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 4096,
    },
    { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, timeout: 120000 }
  );
  return response.data.choices[0].message.content;
};

module.exports = { sendMessageToGroq, getSystemPrompt };