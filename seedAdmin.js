require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const email = 'admin@aironchat.com';
    const username = 'admin';
    const password = 'Airon2024!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se já existe
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      console.log('Admin já existe. Atualizando senha...');
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('Senha atualizada.');
    } else {
      console.log('Criando admin...');
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        [username, email, hashedPassword, 'admin']
      );
      console.log('Admin criado com sucesso.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err);
    process.exit(1);
  }
})();