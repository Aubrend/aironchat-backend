const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);

// Rota de teste que não depende do banco
app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

// Conexão global com cache
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // timeout de 5 segundos
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error.message);
    throw error;
  }
};

// Handler assíncrono que conecta antes de processar
const handler = async (req, res) => {
  try {
    await connectToDatabase();
    return serverless(app)(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Falha na conexão com o banco de dados', detail: error.message });
  }
};

module.exports = handler;