const { Router } = require('express');
const { body } = require('express-validator');
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const {
  listarProductos,
  crearProducto,
  editarProducto,
  toggleActivo,
  eliminarProducto,
  actualizarStock
} = require('../controllers/productoController');

const router = Router();

/**
 * Wrapper para pasar errores de Multer al errorHandler de Express.
 */
const uploadImagen = (req, res, next) => {
  upload.single('imagen')(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

// Reglas de validación reutilizables
const productoValidators = [
  body('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('precio')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El precio debe ser un número mayor a 0'),
  body('categoria')
    .notEmpty().withMessage('La categoría es obligatoria')
    .isIn(['bebidas', 'alimentos', 'postres', 'otros']).withMessage('Categoría no válida'),
  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),
];

// ─── Rutas ───────────────────────────────────────────────────────────────────
router.get('/', protect, listarProductos);
router.post('/', protect, checkRole(['admin']), uploadImagen, productoValidators, crearProducto);
router.put('/:id', protect, checkRole(['admin']), uploadImagen, productoValidators, editarProducto);
router.patch('/:id/toggle', protect, checkRole(['admin']), toggleActivo);
router.patch('/:id/stock', protect, checkRole(['admin']), actualizarStock);
router.delete('/:id', protect, checkRole(['admin']), eliminarProducto);

module.exports = router;
