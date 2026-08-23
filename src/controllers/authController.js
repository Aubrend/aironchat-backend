const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'segredoSuperSecretoAironChat2024!';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ error: 'Email ou nome de utilizador já cadastrado' });
    }
    const user = new User({ username, email, password });
    await user.save();
    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone || '', photoUrl: user.photoUrl || null, role: user.role },
    });
  } catch (error) {
    console.error('Erro no registo:', error.message);
    res.status(500).json({ error: 'Erro ao registar utilizador', detail: error.message });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone || '', photoUrl: user.photoUrl || null, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({ error: 'Erro ao fazer login', detail: error.message });
  }
};

// ... (restante igual ao anterior)