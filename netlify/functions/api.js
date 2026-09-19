// AironChat Backend - Netlify Function
// NOTA: As rotas sÃƒÂ£o registadas com prefixo /api porque o Netlify
// redireciona /api/* para /.netlify/functions/api/:splat, e o
// serverless-http entrega o path completo (ex: /.netlify/functions/api/health).
// Registar com /api garante que o Express encontra as rotas.
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

// Health check (COM prefixo /api)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'aironchat-backend', platform: 'netlify' });
});

// Debug (COM prefixo /api)
app.get('/api/debug', (req, res) => {
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
  });
});

// Rota info (COM prefixo /api)
app.get('/api', (req, res) => {
  res.json({ message: 'AironChat API rodando!', platform: 'netlify' });
});

// Importar rotas (COM prefixo /api)
try {
  const authRoutes = require('../../src/routes/auth');
  const chatRoutes = require('../../src/routes/chat');
  const conversationRoutes = require('../../src/routes/conversations');
  const adminRoutes = require('../../src/routes/admin');
  const documentRoutes = require('../../src/routes/documents');
  const codeRoutes = require('../../src/routes/code');

  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/code', codeRoutes);

  console.log('Rotas carregadas com sucesso');
} catch (err) {
  console.error('Erro ao carregar rotas:', err.message);
}

// Handler 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota nÃƒÂ£o encontrada',
    path: req.originalUrl,
    url: req.url,
  });
});

// Handler de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

module.exports.handler = serverless(app);