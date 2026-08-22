const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');

// Todas as rotas precisam de auth + admin
router.use(authMiddleware, adminAuth);

// Estatísticas
router.get('/stats', adminController.getStats);

// Listar utilizadores
router.get('/users', adminController.getUsers);

// Eliminar utilizador
router.delete('/users/:userId', adminController.deleteUser);

// Tornar admin/utilizador
router.put('/users/:userId/toggle-admin', adminController.toggleAdmin);

// Configurações de API
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

module.exports = router;