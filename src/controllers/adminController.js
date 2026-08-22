const User = require('../models/User');
const Conversation = require('../models/Conversation');

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Conversation.aggregate([
      { $unwind: '$messages' },
      { $count: 'count' }
    ]);
    res.json({
      totalUsers,
      totalConversations,
      totalMessages: totalMessages.length > 0 ? totalMessages[0].count : 0,
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ users });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Não podes eliminar a tua própria conta' });
    }
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    // Apagar conversas desse usuário
    await Conversation.deleteMany({ user: userId });
    res.json({ message: 'Utilizador eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
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
    console.error('Erro ao alterar role:', error);
    res.status(500).json({ error: 'Erro ao alterar role' });
  }
};

exports.updateSettings = async (req, res) => {
  // Para futuras configurações globais (ex: modelo, temperatura)
  // Podes armazenar em uma coleção "Settings", mas por agora retornamos ok.
  res.json({ message: 'Configurações atualizadas' });
};