const express = require('express');
const router = express.Router();
const { abrirCaja, realizarCorte, obtenerEstadoCaja } = require('../controllers/cajaController');
const { protect } = require('../middleware/auth');

// Todas las rutas de caja requieren estar autenticado
router.use(protect);

router.get('/estado', obtenerEstadoCaja);
router.post('/abrir', abrirCaja);
router.post('/cortar', realizarCorte);

module.exports = router;
