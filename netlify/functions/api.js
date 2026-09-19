const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Debug
app.get('/api/debug', (req, res) => {
  res.json({
    platform: 'netlify',
    originalUrl: req.originalUrl,
    url: req.url,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
  });
});

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aironchat-backend', platform: 'netlify' });
});

// Root
app.get('/api', (req, res) => {
  res.json({ message: 'AironChat API rodando!', platform: 'netlify' });
});

// ── Carregamento individual das rotas (defensivo) ──
const loadStatus = {};

function loadRoute(mountPath, modulePath) {
  try {
    const router = require(modulePath);
    app.use(mountPath, router);
    loadStatus[mountPath] = 'OK';
  } catch (err) {
    loadStatus[mountPath] = `ERRO: ${err.message}`;
    console.error(`Erro ao carregar ${mountPath}:`, err.message);
  }
}

loadRoute('/api/auth', '../../src/routes/auth');
loadRoute('/api/chat', '../../src/routes/chat');
loadRoute('/api/conversations', '../../src/routes/conversations');
loadRoute('/api/admin', '../../src/routes/admin');
loadRoute('/api/documents', '../../src/routes/documents');

// Expor loadStatus no /api/debug
app.get('/api/load-status', (req, res) => {
  res.json(loadStatus);
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    loadStatus,
  });
});

// Erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

module.exports.handler = serverless(app);