const Setting = require('../models/Setting');

// Obter chaves (apenas admin)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.json({ settings });
  } catch (error) {
    console.error('Erro ao obter configurações:', error);
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
};

// Atualizar chaves
exports.updateSettings = async (req, res) => {
  try {
    const { groq_api_key, openai_api_key, deepseek_api_key, anthropic_api_key } = req.body;
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    if (groq_api_key !== undefined) settings.groq_api_key = groq_api_key;
    if (openai_api_key !== undefined) settings.openai_api_key = openai_api_key;
    if (deepseek_api_key !== undefined) settings.deepseek_api_key = deepseek_api_key;
    if (anthropic_api_key !== undefined) settings.anthropic_api_key = anthropic_api_key;
    await settings.save();
    res.json({ settings });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
};