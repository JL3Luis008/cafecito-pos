const express = require('express');
const router = express.Router();
const { getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } = require('../controllers/promocionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getPromociones);

// Solo el administrador puede modificar promociones
router.use(authorize('admin'));
router.post('/', crearPromocion);
router.put('/:id', actualizarPromocion);
router.delete('/:id', eliminarPromocion);

module.exports = router;
