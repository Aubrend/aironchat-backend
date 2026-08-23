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
    console.log('Erro de validação no registo:', errors.array());
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
    console.error('Erro no registo:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Erro de validação no login:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    console.log('Tentativa de login para:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Utilizador não encontrado para email:', email);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Senha correta?', isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user._id);
    console.log('Login bem sucedido para:', email);
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, phone: user.phone || '', photoUrl: user.photoUrl || null, role: user.role },
    });
  } catch (error) {
    console.error('Erro no login:', error.message, error.stack);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ user });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    res.status(500).json({ error: 'Erro ao obter perfil' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phone, photoUrl } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (photoUrl !== undefined) updates.photoUrl = photoUrl;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ user });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao mudar senha:', error);
    res.status(500).json({ error: 'Erro ao mudar senha' });
  }
};