const { Router } = require('express');
const { body } = require('express-validator');
const { obtenerClientes, crearCliente, actualizarCliente } = require('../controllers/clienteController');
const { protect } = require('../middleware/auth');

const router = Router();

const clienteValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('telefono').optional().trim(),
  body('email').optional().isEmail().withMessage('Email no válido'),
];
router.get('/', protect, obtenerClientes);
router.post('/', protect, clienteValidators, crearCliente);
router.put('/:id', protect, clienteValidators, actualizarCliente);

module.exports = router;
