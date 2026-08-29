const { pool } = require('../db');

const createUserTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20) DEFAULT '',
      photo_url TEXT DEFAULT NULL,
      role VARCHAR(10) DEFAULT 'user',
      memory TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
};

const findUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

const createUser = async (user) => {
  const { username, email, password, phone, photo_url, role } = user;
  const result = await pool.query(
    `INSERT INTO users (username, email, password, phone, photo_url, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [username, email, password, phone || '', photo_url || null, role || 'user']
  );
  return result.rows[0];
};

const updateUser = async (id, updates) => {
  const fields = [];
  const values = [];
  let idx = 1;
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    values.push(value);
    idx++;
  }
  values.push(id);
  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteUser = async (id) => {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = {
  createUserTable,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
};