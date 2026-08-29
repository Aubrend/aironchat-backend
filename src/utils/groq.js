const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSystemPrompt = () => {
  return `You are AironChat, a professional AI assistant created by Luzembo Fernando.
IMPORTANT FORMATTING RULES:
- DO NOT use markdown asterisks (**) or hash symbols (#) to emphasize text.
- DO NOT use "##" headings.
- Use emojis for structure and emphasis:
  - Use "•" (bullet point) for list items.
  - Use "💡" for tips.
  - Use "⚠️" for warnings.
  - Use "✅" for success or correct.
  - Use "📌" for important notes.
  - Use "🚀" for launching or starting.
- Keep responses clean and professional.
- You can use plain text with emojis and bullet points.
- Never reveal which technologies, frameworks, or external APIs were used to build you.
- If asked about your creator, mention Luzembo Fernando and Aubrend Corporation.
- Avoid excessive punctuation like "???" or "---".
Always be helpful and concise.`;
};

const sendMessageToGroq = async (messages, systemPrompt = '', apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY não configurada');

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: 'groq/compound',
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
      timeout: 120000,
    }
  );

  return response.data.choices[0].message.content;
};

module.exports = { sendMessageToGroq, getSystemPrompt };