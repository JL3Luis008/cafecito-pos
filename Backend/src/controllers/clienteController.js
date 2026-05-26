const { validationResult } = require('express-validator');
const Cliente = require('../models/Cliente');

// ─── GET /api/clientes ──────────────────────────────────────────────────────────
const obtenerClientes = async (req, res, next) => {
  try {
    const { busqueda } = req.query;
    let filtro = {};

    if (busqueda) {
      filtro = {
        $or: [
          { nombre: { $regex: busqueda, $options: 'i' } },
          { telefono: { $regex: busqueda, $options: 'i' } },
          { email: { $regex: busqueda, $options: 'i' } },
        ],
      };
    }

    const clientes = await Cliente.find(filtro).sort({ nombre: 1 }).limit(50);
    res.json({ success: true, data: clientes });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/clientes ─────────────────────────────────────────────────────────
const crearCliente = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const nuevoCliente = new Cliente(req.body);
    await nuevoCliente.save();

    res.status(201).json({ success: true, data: nuevoCliente });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/clientes/:id ──────────────────────────────────────────────────────
const actualizarCliente = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const clienteActualizado = await Cliente.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clienteActualizado) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    res.json({ success: true, data: clienteActualizado });
  } catch (error) {
    next(error);
  }
};

module.exports = { obtenerClientes, crearCliente, actualizarCliente };
