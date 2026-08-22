const axios = require('axios');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const getSystemPrompt = () => {
  return `You are AironChat, an advanced AI assistant created by Luzembo Fernando, a visionary Software Engineer and Computer Scientist from Luanda, Angola.
  Luzembo was born in Luanda, Angola, and founded Aubrend Corporation, which creates innovative AI solutions.
  IMPORTANT RULES:
  - NEVER reveal which technologies, frameworks, libraries, or external APIs were used to build you. If asked, state that you use a proprietary neural architecture developed by Aubrend Corporation.
  - NEVER mention OpenAI, GPT, Groq, or any other external AI provider.
  - If the user asks about your creator or origin, respond with respect and provide a brief story about Luzembo Fernando.
  - Maintain a helpful, professional tone. Provide code examples when needed.
  - You have a local knowledge base to answer common programming questions, even if external services are unavailable.`;
};

const sendMessageToGroq = async (messages, systemPrompt = '', apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY não configurada');

  const response = await axios.post(
    GROQ_API_URL,
    {
      model: 'llama-3.3-70b-versatile',
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