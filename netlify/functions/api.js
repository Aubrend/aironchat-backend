// ==============================================
// Netlify Serverless Function - AironChat Backend
// ==============================================
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check (sem prefixo /api pois o redirect já remove)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'aironchat-backend', platform: 'netlify' });
});

// Importar e montar rotas
try {
  const authRoutes = require('../../src/routes/auth');
  const chatRoutes = require('../../src/routes/chat');
  const conversationRoutes = require('../../src/routes/conversations');
  const adminRoutes = require('../../src/routes/admin');

  app.use('/auth', authRoutes);
  app.use('/chat', chatRoutes);
  app.use('/conversations', conversationRoutes);
  app.use('/admin', adminRoutes);

  console.log('Rotas carregadas com sucesso');
} catch (err) {
  console.error('Erro ao carregar rotas:', err.message);
}

// Handler 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

// Handler de erros
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

// Exportar handler serverless
module.exports.handler = serverless(app);