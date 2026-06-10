const { validationResult } = require('express-validator');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');

const calcularPorcentajeDescuento = (comprasCount) => {
  if (!comprasCount || comprasCount === 0) return 0;
  if (comprasCount >= 1 && comprasCount <= 3) return 5;
  if (comprasCount >= 4 && comprasCount <= 7) return 10;
  if (comprasCount >= 8) return 15;
  return 0;
};

// ─── POST /api/ventas ─────────────────────────────────────────────────────────
/**
 * Registra una venta.
 * Los precios se recalculan desde la BD — no se confía en el frontend.
 */
const registrarVenta = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, clienteId, metodoPago, efectivoRecibido, cambio } = req.body;

    // Obtener productos activos de la BD (ignora precios del cliente)
    const productoIds = items.map((i) => i.productoId);
    const productos = await Producto.find({
      _id: { $in: productoIds },
      activo: true,
    });

    const productoMap = {};
    productos.forEach((p) => { productoMap[p._id.toString()] = p; });

    // Validar que todos los productos existen y están activos
    const itemsVenta = [];
    let total = 0;

    for (const item of items) {
      const producto = productoMap[item.productoId];
      if (!producto) {
        return res.status(400).json({
          success: false,
          error: `Producto no disponible: ${item.productoId}`,
        });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }

      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      total += subtotal;

      itemsVenta.push({
        producto: producto._id,
        nombre:   producto.nombre,   // snapshot
        precio:   producto.precio,   // snapshot
        cantidad: item.cantidad,
        subtotal,
      });
    }

    const subtotalBruto = parseFloat(total.toFixed(2));

    // Descuento por Fidelidad
    let descuentoPorcentaje = 0;
    let descuentoMonto = 0;
    let totalFinal = subtotalBruto;

    if (clienteId) {
      const cliente = await Cliente.findById(clienteId);
      if (cliente) {
        descuentoPorcentaje = calcularPorcentajeDescuento(cliente.comprasRealizadas);
        descuentoMonto = parseFloat((subtotalBruto * (descuentoPorcentaje / 100)).toFixed(2));
        totalFinal = parseFloat((subtotalBruto - descuentoMonto).toFixed(2));
      }
    }

    // Calcular desglose de impuestos (IVA 16% incluido en el total)
    const impuestos = parseFloat((totalFinal * (0.16 / 1.16)).toFixed(2));

    const venta = new Venta({
      items:   itemsVenta,
      subtotal: subtotalBruto,
      impuestos,
      descuentoMonto,
      descuentoPorcentaje,
      total: totalFinal,
      metodoPago: metodoPago || 'efectivo',
      efectivoRecibido: efectivoRecibido || 0,
      cambio: cambio || 0,
      cajero:  req.user?.id ?? null,
      cliente: clienteId   ?? null,
    });

    await venta.save();

    // Actualización de Stock
    const bulkOpsProductos = itemsVenta.map((item) => ({
      updateOne: {
        filter: { _id: item.producto },
        update: { $inc: { stock: -item.cantidad } },
      },
    }));
    await Producto.bulkWrite(bulkOpsProductos);

    // Incrementar contador del cliente
    if (clienteId) {
      await Cliente.findByIdAndUpdate(clienteId, { $inc: { comprasRealizadas: 1 } });
    }

    res.status(201).json({ success: true, data: venta });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ventas/:id ──────────────────────────────────────────────────────
const obtenerVenta = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cajero',  'nombre email')
      .populate('cliente', 'nombre telefono');

    if (!venta) {
      return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    }

    res.json({ success: true, data: venta });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ventas ──────────────────────────────────────────────────────────
// Historial de ventas (Sprint 4 restringirá a admin)
const listarVentas = async (req, res, next) => {
  try {
    const ventas = await Venta.find({ estado: 'completada' })
      .populate('cajero',  'nombre')
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, total: ventas.length, data: ventas });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrarVenta, obtenerVenta, listarVentas };
