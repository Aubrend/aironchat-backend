const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  family: 4,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Erro no pool PostgreSQL:', err);
});

pool.on('connect', () => {
  console.log('Ligação PostgreSQL estabelecida');
});

module.exports = { pool };