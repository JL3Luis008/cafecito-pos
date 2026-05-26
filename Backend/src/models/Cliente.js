const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      maxlength: [80, 'El nombre no puede superar 80 caracteres'],
      index: true, // Búsqueda rápida por nombre
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio'],
      unique: true,
      trim: true,
      index: true, // Búsqueda rápida por teléfono
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      match: [/^\S+@\S+\.\S+$/, 'Formato de correo no válido'],
    },
    comprasRealizadas: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model('Cliente', clienteSchema);
