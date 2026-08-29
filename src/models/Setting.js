const { pool } = require('../db');

const createSettingTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      groq_api_key TEXT DEFAULT '',
      openai_api_key TEXT DEFAULT '',
      deepseek_api_key TEXT DEFAULT '',
      anthropic_api_key TEXT DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const getSetting = async () => {
  const result = await pool.query('SELECT * FROM settings LIMIT 1');
  return result.rows[0] || null;
};

const createOrUpdateSetting = async (data) => {
  // Se não existir, cria; senão atualiza
  const existing = await getSetting();
  if (!existing) {
    const result = await pool.query(
      `INSERT INTO settings (groq_api_key, openai_api_key, deepseek_api_key, anthropic_api_key)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.groq_api_key, data.openai_api_key, data.deepseek_api_key, data.anthropic_api_key]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `UPDATE settings SET groq_api_key = $1, openai_api_key = $2, deepseek_api_key = $3, anthropic_api_key = $4, updated_at = NOW() WHERE id = $5 RETURNING *`,
      [data.groq_api_key, data.openai_api_key, data.deepseek_api_key, data.anthropic_api_key, existing.id]
    );
    return result.rows[0];
  }
};

module.exports = { createSettingTable, getSetting, createOrUpdateSetting };