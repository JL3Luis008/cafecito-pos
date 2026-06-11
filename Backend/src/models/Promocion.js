const mongoose = require('mongoose');

const promocionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    descripcion: {
      type: String,
      trim: true
    },
    tipo: {
      type: String,
      enum: ['porcentaje', 'fijo'],
      default: 'porcentaje'
    },
    valor: {
      type: Number,
      required: true,
      min: 0
    },
    fechaInicio: {
      type: Date,
      required: true
    },
    fechaFin: {
      type: Date,
      required: true
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para verificar si la promo está expirada antes de devolverla
promocionSchema.virtual('estaVigente').get(function() {
  const ahora = new Date();
  return this.activo && ahora >= this.fechaInicio && ahora <= this.fechaFin;
});

module.exports = mongoose.model('Promocion', promocionSchema);
