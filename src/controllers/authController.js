const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('[authController] JWT_SECRET não configurado nas variáveis de ambiente');
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Preencha todos os campos' });

    const existing = await User.findUserByEmail(email) || await User.findUserByUsername(username);
    if (existing) return res.status(400).json({ error: 'Email ou nome de utilizador já cadastrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.createUser({ username, email, password: hashedPassword });
    const token = generateToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone, photoUrl: user.photo_url, role: user.role }
    });
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ error: 'Erro ao registar utilizador' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = generateToken(user.id);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, phone: user.phone, photoUrl: user.photo_url, role: user.role }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ user: { id: user.id, username: user.username, email: user.email, phone: user.phone, photoUrl: user.photo_url, role: user.role } });
  } catch (error) {
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
    if (photoUrl !== undefined) updates.photo_url = photoUrl;
    const user = await User.updateUser(req.userId, updates);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    res.json({ user: { id: user.id, username: user.username, email: user.email, phone: user.phone, photoUrl: user.photo_url, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Senha atual incorreta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.updateUser(req.userId, { password: hashed });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao mudar senha' });
  }
};