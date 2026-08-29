const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000, // 10 segundos
  family: 4, // forçar IPv4
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err);
});

pool.on('connect', () => {
  console.log('Ligação PostgreSQL estabelecida');
});

module.exports = { pool };