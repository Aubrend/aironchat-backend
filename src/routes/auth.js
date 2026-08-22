const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

// Validações para registo
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Nome de utilizador deve ter pelo menos 3 caracteres'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
];

// Validações para login
const loginValidation = [
  body('emailOrUsername').trim().notEmpty().withMessage('Credencial é obrigatória'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;