const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'Utilizador não encontrado' });
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro no adminAuth:', error);
    res.status(500).json({ error: 'Erro de autorização' });
  }
};