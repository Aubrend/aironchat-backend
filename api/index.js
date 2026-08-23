const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const serverless = require('serverless-http');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');
const adminRoutes = require('../src/routes/admin');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rota de saúde rápida, sem depender do banco
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Conexão preguiçosa e com timeout curto
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return true;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI não definida');
    throw new Error('MONGODB_URI não definida');
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      family: 4,
    });
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error.message);
    throw error;
  }
};

// Middleware para conectar apenas em /api (excepto /api/health)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next(); // já respondido antes
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    return res.status(503).json({
      error: 'Serviço indisponível',
      detail: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

// Para desenvolvimento local
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

module.exports = serverless(app);