const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const settingsController = require('../controllers/settingsController');

router.use(authMiddleware, adminAuth);
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.delete('/users/:userId', adminController.deleteUser);
router.put('/users/:userId/toggle-admin', adminController.toggleAdmin);
router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

module.exports = router;