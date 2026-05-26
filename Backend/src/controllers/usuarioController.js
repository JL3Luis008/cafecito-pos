const Usuario = require('../models/Usuario');

// ─── GET /api/usuarios ────────────────────────────────────────────────────────
const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: usuarios });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/usuarios ───────────────────────────────────────────────────────
const crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const emailExiste = await Usuario.findOne({ email });
    if (emailExiste) {
      return res.status(400).json({ success: false, error: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      rol
    });

    const creado = await Usuario.findById(usuario._id).select('-password');
    res.status(201).json({ success: true, data: creado });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/usuarios/:id ────────────────────────────────────────────────────
const actualizarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, rol, activo, password } = req.body;
    let usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Si cambia email, verificar disponibilidad
    if (email && email !== usuario.email) {
      const emailExiste = await Usuario.findOne({ email });
      if (emailExiste) {
        return res.status(400).json({ success: false, error: 'El email ya lo usa otro usuario' });
      }
    }

    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    usuario.rol = rol || usuario.rol;
    if (typeof activo !== 'undefined') usuario.activo = activo;

    // Si viene password, se encriptará por el pre-save hook del modelo
    if (password) usuario.password = password;

    await usuario.save();

    const actualizado = await Usuario.findById(usuario._id).select('-password');
    res.json({ success: true, data: actualizado });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/usuarios/:id ─────────────────────────────────────────────────
const eliminarUsuario = async (req, res, next) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // No permitir que un admin se elimine a sí mismo (seguridad básica)
    if (usuario._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminarte a ti mismo' });
    }

    // Eliminación lógica marcando como inactivo
    usuario.activo = false;
    await usuario.save();

    res.json({ success: true, message: 'Usuario desactivado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
