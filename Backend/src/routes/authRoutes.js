const { Router } = require('express');
const { body } = require('express-validator');
const { login, obtenerPerfil, actualizarPerfil, cambiarPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

const router = Router();

const loginValidators = [
  body('email').isEmail().withMessage('Debe ser un email válido').normalizeEmail(),
  body('password').notEmpty().withMessage('El password es obligatorio'),
];

router.post('/login', loginValidators, login);
router.get('/me', protect, obtenerPerfil);

// Nuevas rutas de usuario
router.put('/perfil', protect, upload.single('avatar'), actualizarPerfil);
router.put('/password', [
  protect,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], cambiarPassword);

module.exports = router;
