const { Router } = require('express');
const { body } = require('express-validator');
const { login, obtenerPerfil } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = Router();

const loginValidators = [
  body('email').isEmail().withMessage('Debe ser un email válido').normalizeEmail(),
  body('password').notEmpty().withMessage('El password es obligatorio'),
];

router.post('/login', loginValidators, login);
router.get('/me', protect, obtenerPerfil);

module.exports = router;
