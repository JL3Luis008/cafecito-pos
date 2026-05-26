const { Router } = require('express');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { 
  getDashboardStats, 
  getSalesTrend, 
  getSalesByCategory,
  getSalesByUser,
  getTodaySalesDetailed
} = require('../controllers/reporteController');

const router = Router();

// Todas las rutas de reportes requieren ser Admin
router.use(protect);
router.use(checkRole(['admin']));

router.get('/dashboard', getDashboardStats);
router.get('/tendencia', getSalesTrend);
router.get('/categorias', getSalesByCategory);
router.get('/usuarios', getSalesByUser);
router.get('/hoy-detalle', getTodaySalesDetailed);

module.exports = router;
