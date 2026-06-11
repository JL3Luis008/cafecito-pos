const mongoose = require('mongoose');

const corteCajaSchema = new mongoose.Schema(
  {
    cajero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
    },
    fechaApertura: {
      type: Date,
      default: Date.now,
    },
    fechaCierre: {
      type: Date,
    },
    montoApertura: {
      type: Number,
      required: true,
      min: 0,
    },
    ventasSistema: {
      efectivo: { type: Number, default: 0 },
      tarjeta: { type: Number, default: 0 },
      transferencia: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    montoCierreReal: {
      type: Number,
      min: 0,
      default: 0
    },
    diferencia: {
      type: Number,
      default: 0
    },
    estado: {
      type: String,
      enum: ['abierto', 'cerrado'],
      default: 'abierto',
    },
    notas: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice para buscar el último corte abierto de un cajero
corteCajaSchema.index({ cajero: 1, estado: 1 });

module.exports = mongoose.model('CorteCaja', corteCajaSchema);
