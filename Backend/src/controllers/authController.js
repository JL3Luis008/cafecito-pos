const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Find user by email
    const usuario = await Usuario.findOne({ email }).select('+password');
    if (!usuario) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Check if active
    if (!usuario.activo) {
      return res.status(401).json({ success: false, error: 'Cuenta suspendida' });
    }

    // Check password
    const isMatch = await usuario.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Generate token
    const token = generarToken(usuario._id, usuario.rol);

    res.json({
      success: true,
      data: {
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const obtenerPerfil = async (req, res, next) => {
  try {
    // req.user ya está inyectado por el middleware 'protect'
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    res.json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  obtenerPerfil,
};
