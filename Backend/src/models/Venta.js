const mongoose = require('mongoose');

// Snapshot del producto en el momento de la venta
// (precio/nombre no cambia aunque el producto se edite después)
const itemVentaSchema = new mongoose.Schema(
  {
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    nombre: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    cantidad: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ventaSchema = new mongoose.Schema(
  {
    folio: {
      type: String,
      unique: true,
      index: true,
    },
    items: {
      type: [itemVentaSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'La venta debe tener al menos un producto',
      },
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    descuentoMonto: {
      type: Number,
      default: 0,
    },
    descuentoPorcentaje: {
      type: Number,
      enum: [0, 5, 10, 15],
      default: 0,
    },
    cajero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      default: null, // Sprint 4 lo hace requerido
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      default: null, // Opcional
    },
    estado: {
      type: String,
      enum: ['completada', 'cancelada'],
      default: 'completada',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Generar folio automáticamente antes de guardar (CF-000001, CF-000002, ...)
ventaSchema.pre('save', async function () {
  if (!this.folio) {
    const count = await mongoose.model('Venta').countDocuments();
    this.folio = `CF-${String(count + 1).padStart(6, '0')}`;
  }
});

// Índices para reportes por fecha y estado
ventaSchema.index({ createdAt: -1 });
ventaSchema.index({ estado: 1, createdAt: -1 });
// Índice compuesto para reporte de desempeño por cajero (getSalesByUser)
ventaSchema.index({ cajero: 1, estado: 1, createdAt: -1 });
// Índice para reporte de productos más vendidos
ventaSchema.index({ 'items.producto': 1, estado: 1 });

module.exports = mongoose.model('Venta', ventaSchema);
