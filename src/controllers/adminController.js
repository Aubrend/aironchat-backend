const User = require('../models/User');
const Conversation = require('../models/Conversation');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Conversation.aggregate([{ $unwind: '$messages' }, { $count: 'count' }]);
    res.json({ totalUsers, totalConversations, totalMessages: totalMessages.length ? totalMessages[0].count : 0 });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.userId) return res.status(400).json({ error: 'Não podes eliminar a tua própria conta' });
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    await Conversation.deleteMany({ user: userId });
    res.json({ message: 'Utilizador eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
};

exports.toggleAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar papel' });
  }
};

exports.updateSettings = async (req, res) => {
  res.json({ message: 'Configurações atualizadas' });
};