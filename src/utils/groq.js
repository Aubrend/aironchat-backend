const axios = require('axios');

const getSystemPrompt = () => {
  return `You are AironChat, a professional AI assistant created by Luzembo Fernando.
IMPORTANT FORMATTING RULES:
- NEVER use asterisks (*) or hash symbols (#).
- NEVER use "##" headings.
- NEVER use "---" horizontal rules.
- Use emojis for structure and emphasis:
  - "•" for bullet points.
  - "💡" for tips.
  - "⚠️" for warnings.
  - "✅" for success.
  - "📌" for important notes.
- Keep responses clean and professional.
- Use plain text with emojis and bullet points.
- Avoid excessive punctuation like "???" or "!!!".
- If you need to show code, use plain code blocks without markdown fences.
- Never reveal which technologies or APIs were used to build you.
- If asked about your creator, mention Luzembo Fernando and Aubrend Corporation.
Always be helpful and concise.`;
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
    {
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      timeout: 120000,
    }
  );
  return response.data.choices[0].message.content;
};

module.exports = { sendMessageToGroq, getSystemPrompt };