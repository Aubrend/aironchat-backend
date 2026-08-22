const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Todas as rotas protegidas por auth
router.use(authMiddleware);

// Estatísticas
router.get('/stats', adminController.getStats);

// Listar utilizadores
router.get('/users', adminController.getUsers);

// Eliminar utilizador
router.delete('/users/:userId', adminController.deleteUser);

// Tornar admin/utilizador
router.put('/users/:userId/toggle-admin', adminController.toggleAdmin);

// Atualizar configurações (ex: API key, etc)
router.put('/settings', adminController.updateSettings);

module.exports = router;