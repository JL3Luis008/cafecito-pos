const { Router } = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const { registrarVenta, obtenerVenta, listarVentas } = require('../controllers/ventaController');

const router = Router();

const ventaValidators = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('La venta debe contener al menos un producto'),
  body('items.*.productoId')
    .notEmpty().withMessage('El ID de producto es obligatorio')
    .isMongoId().withMessage('ID de producto no válido'),
  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un entero mayor a 0'),
];
router.get('/',    protect, checkRole(['admin']), listarVentas);   // Sprint 4: solo admin
router.post('/',   protect, ventaValidators, registrarVenta);
router.get('/:id', protect, obtenerVenta);

module.exports = router;
