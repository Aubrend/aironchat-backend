// ==============================================
// AironChat Backend — Servidor local de desenvolvimento
// ==============================================
// Este ficheiro é usado APENAS para desenvolvimento local (npm start / npm run dev).
// Em produção, o backend corre como função serverless no Netlify:
//   → netlify/functions/api.js
// ==============================================
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');
const adminRoutes = require('../src/routes/admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', platform: 'local-dev', time: new Date().toISOString() });
});

// Rotas (mesmo prefixo que em produção no Netlify)
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AironChat API — local dev', environment: process.env.NODE_ENV || 'development' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl });
});

// Erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor local rodando em http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});