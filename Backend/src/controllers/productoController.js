const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const Producto = require('../models/Producto');

/**
 * Elimina una imagen del disco si existe.
 */
const deleteImageFile = (imagePath) => {
  if (!imagePath) return;
  const fullPath = path.join(__dirname, '..', '..', 'uploads', path.basename(imagePath));
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// ─── GET /api/productos ──────────────────────────────────────────────────────
// Query params: ?activo=true|false|all  &  ?categoria=bebidas|alimentos|...
const listarProductos = async (req, res, next) => {
  try {
    const { activo, categoria } = req.query;
    const filtro = {};

    if (activo === 'all') {
      // Sin filtro de estado
    } else {
      filtro.activo = activo === 'false' ? false : true;
    }

    if (categoria && ['bebidas', 'alimentos', 'postres', 'otros'].includes(categoria)) {
      filtro.categoria = categoria;
    }

    const productos = await Producto.find(filtro).sort({ categoria: 1, nombre: 1 });
    res.json({ success: true, total: productos.length, data: productos });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/productos ─────────────────────────────────────────────────────
const crearProducto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Si hubo un archivo subido pero la validación falló, eliminar el archivo
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, precio, categoria, stock } = req.body;
    const imagen = req.file ? `/uploads/${req.file.filename}` : null;

    const producto = new Producto({ nombre, precio: parseFloat(precio), categoria, stock: parseInt(stock, 10), imagen });
    await producto.save();

    res.status(201).json({ success: true, data: producto });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    next(error);
  }
};

// ─── PUT /api/productos/:id ───────────────────────────────────────────────────
const editarProducto = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const productoExistente = await Producto.findById(req.params.id);
    if (!productoExistente) {
      if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const { nombre, precio, categoria, stock } = req.body;
    const updates = { nombre, precio: parseFloat(precio), categoria, stock: parseInt(stock, 10) };

    // Si se subió nueva imagen, reemplazar la anterior
    if (req.file) {
      deleteImageFile(productoExistente.imagen);
      updates.imagen = `/uploads/${req.file.filename}`;
    }

    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: productoActualizado });
  } catch (error) {
    if (req.file) deleteImageFile(`/uploads/${req.file.filename}`);
    next(error);
  }
};

// ─── PATCH /api/productos/:id/toggle ────────────────────────────────────────
const toggleActivo = async (req, res, next) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    producto.activo = !producto.activo;
    await producto.save();

    res.json({
      success: true,
      mensaje: `Producto ${producto.activo ? 'activado' : 'desactivado'} correctamente`,
      data: producto,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/productos/:id ───────────────────────────────────────────────
const eliminarProducto = async (req, res, next) => {
  try {
    const producto = await Producto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    // Sprint 2 agregará verificación de ventas; por ahora elimina directamente
    deleteImageFile(producto.imagen);
    await producto.deleteOne();

    res.json({ success: true, mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listarProductos, crearProducto, editarProducto, toggleActivo, eliminarProducto };
