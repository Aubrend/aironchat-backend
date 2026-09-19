// AironChat Backend - Netlify Function
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Registar tentativas de carregamento para diagnóstico
const loadStatus = {};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'aironchat-backend',
    platform: 'netlify',
    loadStatus,
  });
});

// Debug
app.get('/debug', (req, res) => {
  res.json({
    platform: 'netlify',
    originalUrl: req.originalUrl,
    url: req.url,
    path: req.path,
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    loadStatus,
  });
});

// Tentar carregar cada rota individualmente
try {
  const authRoutes = require('../../src/routes/auth');
  app.use('/auth', authRoutes);
  loadStatus.auth = 'OK';
} catch (err) {
  loadStatus.auth = `ERRO: ${err.message}`;
  console.error('Erro a carregar auth:', err);
}

try {
  const chatRoutes = require('../../src/routes/chat');
  app.use('/chat', chatRoutes);
  loadStatus.chat = 'OK';
} catch (err) {
  loadStatus.chat = `ERRO: ${err.message}`;
  console.error('Erro a carregar chat:', err);
}

try {
  const conversationRoutes = require('../../src/routes/conversations');
  app.use('/conversations', conversationRoutes);
  loadStatus.conversations = 'OK';
} catch (err) {
  loadStatus.conversations = `ERRO: ${err.message}`;
  console.error('Erro a carregar conversations:', err);
}

try {
  const adminRoutes = require('../../src/routes/admin');
  app.use('/admin', adminRoutes);
  loadStatus.admin = 'OK';
} catch (err) {
  loadStatus.admin = `ERRO: ${err.message}`;
  console.error('Erro a carregar admin:', err);
}

// Rota info
app.get('/', (req, res) => {
  res.json({
    message: 'AironChat API rodando!',
    platform: 'netlify',
    loadStatus,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    loadStatus,
  });
});

// Handler de erros do Express
app.use((err, req, res, next) => {
  console.error('Erro no Express:', err);
  res.status(500).json({ error: err.message, stack: err.stack });
});

// Wrapper que captura erros de serverless-http
const serverlessHandler = serverless(app);

module.exports.handler = async (event, context) => {
  try {
    return await serverlessHandler(event, context);
  } catch (err) {
    console.error('Erro no handler serverless:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro no handler serverless',
        message: err.message,
        stack: err.stack,
        loadStatus,
      }),
    };
  }
};