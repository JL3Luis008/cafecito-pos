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
      required: function() { return !this.esPermanente; }
    },
    fechaFin: {
      type: Date,
      required: function() { return !this.esPermanente; }
    },
    esPermanente: {
      type: Boolean,
      default: false
    },
    activo: {
      type: Boolean,
      default: true
    },
    aplicacion: {
      type: String,
      enum: ['automatica', 'manual'],
      default: 'manual'
    },
    criterio: {
      type: String,
      enum: ['general', 'cliente_frecuente'],
      default: 'general'
    },
    minimoCompras: {
      type: Number,
      default: 0
    },
    maximoCompras: {
      type: Number,
      default: 0 // 0 = sin límite superior
    }


  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para verificar si la promo está expirada antes de devolverla
promocionSchema.virtual('estaVigente').get(function() {
  if (!this.activo) return false;
  if (this.esPermanente) return true;
  const ahora = new Date();
  return ahora >= this.fechaInicio && ahora <= this.fechaFin;
});


module.exports = mongoose.model('Promocion', promocionSchema);
