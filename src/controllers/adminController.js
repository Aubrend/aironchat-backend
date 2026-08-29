const { pool } = require('../db');

exports.getStats = async (req, res) => {
  try {
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const conversationsCount = await pool.query('SELECT COUNT(*) FROM conversations');
    const messagesCount = await pool.query('SELECT SUM(jsonb_array_length(messages)) FROM conversations');
    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalConversations: parseInt(conversationsCount.rows[0].count),
      totalMessages: parseInt(messagesCount.rows[0].sum || 0),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, phone, role, created_at FROM users');
    res.json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (parseInt(userId) === req.userId) return res.status(400).json({ error: 'Não podes eliminar a tua própria conta' });
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    await pool.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
    res.json({ message: 'Utilizador eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
};

exports.toggleAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, userId]);
    res.json({ message: 'Papel atualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar papel' });
  }
};

exports.updateSettings = async (req, res) => {
  res.json({ message: 'Configurações atualizadas' });
};