const { sendMessageToGroq } = require('../utils/groq');

// Gera código a partir de um prompt (usado pelo CodePreviewScreen do mobile)
exports.generateCode = async (req, res) => {
  try {
    const { prompt, language } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt obrigatório' });
    }

    const lang = (language || 'html').toLowerCase();

    const systemPrompt = `You are AironChat Code Generator. Produce ONLY the requested ${lang} code.
Rules:
- Output ONLY the raw code, without explanation, without markdown fences, without backticks.
- Do not include any text before or after the code.
- The code must be complete, ready to run, and self-contained.
- If the request is unclear, generate the most reasonable interpretation.`;

    const userMessage = `Language: ${lang}\nTask: ${prompt}`;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY não configurada');

    let code = await sendMessageToGroq(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
      apiKey
    );

    // Limpeza: remover fences markdown se o modelo os devolveu
    code = String(code).trim()
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/```$/, '')
      .trim();

    res.json({ code, language: lang });
  } catch (error) {
    console.error('Erro no generateCode:', error.message);
    res.status(500).json({ error: 'Erro ao gerar código' });
  }
};