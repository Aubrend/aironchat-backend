const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
require('dotenv').config();

const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');
const adminRoutes = require('../src/routes/admin');

const { pool } = require('../src/db');
const User = require('../src/models/User');
const Conversation = require('../src/models/Conversation');
const Setting = require('../src/models/Setting');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Inicializar tabelas (só em desenvolvimento; em produção já existem)
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    await User.createUserTable();
    await Conversation.createConversationTable();
    await Setting.createSettingTable();
    console.log('Tabelas criadas');
  })();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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