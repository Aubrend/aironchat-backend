const { pool } = require('../db');

const createConversationTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) DEFAULT 'Nova Conversa',
      messages JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const findConversationsByUser = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC',
    [userId]
  );
  return result.rows;
};

const findConversationByIdAndUser = async (id, userId) => {
  const result = await pool.query(
    'SELECT * FROM conversations WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
};

const createConversation = async (userId, title) => {
  const result = await pool.query(
    `INSERT INTO conversations (user_id, title, messages) VALUES ($1, $2, $3::jsonb) RETURNING *`,
    [userId, title, JSON.stringify([])]
  );
  return result.rows[0];
};

const updateConversation = async (id, userId, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'messages') {
      // Garantir que value é array
      const messages = Array.isArray(value) ? value : [];
      fields.push(`messages = $${idx}::jsonb`);
      values.push(JSON.stringify(messages));
    } else {
      fields.push(`${key} = $${idx}`);
      values.push(value);
    }
    idx++;
  }

  if (fields.length === 0) return null;

  values.push(id, userId);
  const query = `UPDATE conversations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`;
  console.log('Query update:', query, values);
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteConversation = async (id, userId) => {
  await pool.query('DELETE FROM conversations WHERE id = $1 AND user_id = $2', [id, userId]);
};

module.exports = {
  createConversationTable,
  findConversationsByUser,
  findConversationByIdAndUser,
  createConversation,
  updateConversation,
  deleteConversation,
};