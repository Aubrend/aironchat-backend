const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');
const adminRoutes = require('../src/routes/admin');

const app = express();

// Segurança: headers HTTP
app.use(helmet());

// Compressão de respostas
app.use(compression());

// CORS com origem configurável
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',');
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
}));

// Limite de tamanho do corpo JSON (10 MB)
app.use(express.json({ limit: '10mb' }));

// Rate limiting global (100 pedidos por 15 minutos por IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitos pedidos, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// Rate limiting mais restrito para autenticação (10 tentativas por hora)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Demasiadas tentativas de autenticação, tente novamente em 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

// Middleware de erro centralizado
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Origem não permitida pelo CORS') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// Conexão global com cache
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error.message);
    throw error;
  }
};

// Handler assíncrono para conectar antes das rotas /api
app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Falha na conexão com o banco de dados', detail: error.message });
  }
});

module.exports = app;