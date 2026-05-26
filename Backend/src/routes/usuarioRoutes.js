const { Router } = require('express');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} = require('../controllers/usuarioController');

const router = Router();

// Todas las rutas de gestión de usuarios son exclusivas de Admin
router.use(protect);
router.use(checkRole(['admin']));

router.route('/')
  .get(getUsuarios)
  .post(crearUsuario);

router.route('/:id')
  .put(actualizarUsuario)
  .delete(eliminarUsuario);

module.exports = router;
