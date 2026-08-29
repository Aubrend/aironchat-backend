const Setting = require('../models/Setting');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.getSetting();
    if (!settings) settings = await Setting.createOrUpdateSetting({ groq_api_key: '', openai_api_key: '', deepseek_api_key: '', anthropic_api_key: '' });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter configurações' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { groq_api_key, openai_api_key, deepseek_api_key, anthropic_api_key } = req.body;
    const settings = await Setting.createOrUpdateSetting({ groq_api_key, openai_api_key, deepseek_api_key, anthropic_api_key });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
};