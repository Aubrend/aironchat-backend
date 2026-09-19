const { Pool } = require('pg');

// Deteta se está em ambiente serverless (Vercel, Netlify, AWS Lambda)
const isServerless =
  !!process.env.NETLIFY ||
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.LAMBDA_TASK_ROOT;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: isServerless ? 1 : 10,
  idleTimeoutMillis: isServerless ? 10000 : 30000,
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