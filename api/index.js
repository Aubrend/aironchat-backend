const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
require('dotenv').config();

// Fallback para JWT_SECRET
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'segredoSuperSecretoAironChat2024!';
}

const User = require('../src/models/User');
const authRoutes = require('../src/routes/auth');
const chatRoutes = require('../src/routes/chat');
const conversationRoutes = require('../src/routes/conversations');
const adminRoutes = require('../src/routes/admin');

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitos pedidos, tente novamente mais tarde.',
});
app.use('/api', globalLimiter);

app.get('/', (req, res) => {
  res.json({ message: 'AironChat API rodando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

let isConnected = false;

const seedAdmin = async () => {
  try {
    let admin = await User.findOne({ email: 'admin@aironchat.com' });
    if (!admin) {
      admin = new User({ username: 'admin', email: 'admin@aironchat.com', password: 'Airon2024!', role: 'admin' });
      console.log('Admin criado com sucesso');
    } else {
      admin.username = 'admin';
      admin.email = 'admin@aironchat.com';
      admin.password = 'Airon2024!';
      admin.role = 'admin';
      console.log('Admin actualizado');
    }
    await admin.save();
    console.log('Admin pronto: admin@aironchat.com / Airon2024!');
  } catch (error) {
    console.error('Erro no seedAdmin:', error);
  }
};

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
    await seedAdmin();
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error.message);
    throw error;
  }
};

app.use('/api', async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Falha na conexão com o banco de dados', detail: error.message });
  }
});

// Rota de diagnóstico (temporária)
app.get('/api/debug', async (req, res) => {
  try {
    await connectToDatabase();
    const userCount = await User.countDocuments();
    const admin = await User.findOne({ email: 'admin@aironchat.com' }).select('-password');
    res.json({
      mongoConnected: mongoose.connection.readyState === 1,
      hasJwtSecret: !!process.env.JWT_SECRET,
      userCount,
      admin: admin ? { email: admin.email, username: admin.username, role: admin.role } : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;