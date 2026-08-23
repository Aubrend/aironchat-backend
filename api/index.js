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

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected || mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  isConnected = true;
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Falha na conexão com o banco de dados', detail: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = serverless(app);