const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rota de teste que NÃO depende do banco
app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

// Middleware de conexão apenas para rotas /api
app.use('/api', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
    }
    next();
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error.message);
    res.status(500).json({ error: 'Falha na conexão com o banco de dados', detail: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Exportar o Express diretamente (sem serverless-http)
module.exports = app;