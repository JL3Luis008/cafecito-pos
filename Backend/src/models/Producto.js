const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0.01, 'El precio debe ser mayor a 0'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: ['bebidas', 'alimentos', 'postres', 'otros'],
        message: "'{VALUE}' no es una categoría válida",
      },
    },
    imagen: {
      type: String,
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    stock: {
      type: Number,
      required: [true, 'El stock es obligatorio'],
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice para consultas frecuentes por categoría y estado
productoSchema.index({ categoria: 1, activo: 1 });
// Índice para alertas de stock bajo (stock + activo) — usada en getDashboardStats
productoSchema.index({ stock: 1, activo: 1 });
// Índice de texto para búsqueda rápida por nombre en el catálogo
productoSchema.index({ nombre: 'text' });

module.exports = mongoose.model('Producto', productoSchema);
