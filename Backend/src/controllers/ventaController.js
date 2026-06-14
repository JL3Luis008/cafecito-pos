const { validationResult } = require('express-validator');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Promocion = require('../models/Promocion');

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

    const { items, clienteId, promocionId, metodoPago, efectivoRecibido, cambio } = req.body;

    // Obtener productos activos de la BD
    const productoIds = items.map((i) => i.productoId);
    const productos = await Producto.find({
      _id: { $in: productoIds },
      activo: true,
    });

    const productoMap = {};
    productos.forEach((p) => { productoMap[p._id.toString()] = p; });

    const itemsVenta = [];
    let totalBruto = 0;

    for (const item of items) {
      const producto = productoMap[item.productoId];
      if (!producto) {
        return res.status(400).json({ success: false, error: `Producto no disponible: ${item.productoId}` });
      }

      if (producto.stock < item.cantidad) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        });
      }

      const subtotalItem = parseFloat((producto.price ?? producto.precio * item.cantidad).toFixed(2));
      totalBruto += subtotalItem;

      itemsVenta.push({
        producto: producto._id,
        nombre:   producto.nombre,
        precio:   producto.precio,
        cantidad: item.cantidad,
        subtotal: subtotalItem,
      });
    }

    // Cálculos de Descuentos
    let descuentoFidelidadMonto = 0;
    let descuentoFidelidadPorc = 0;
    let descuentoPromoMonto = 0;

    // 1. Fidelidad
    if (clienteId) {
      const cliente = await Cliente.findById(clienteId);
      if (cliente) {
        descuentoFidelidadPorc = calcularPorcentajeDescuento(cliente.comprasRealizadas);
        descuentoFidelidadMonto = parseFloat((totalBruto * (descuentoFidelidadPorc / 100)).toFixed(2));
      }
    }

    // 2. Promoción Manual/Global
    if (promocionId) {
      const promo = await Promocion.findById(promocionId);
      if (promo && promo.activo) {
        if (promo.tipo === 'porcentaje') {
          descuentoPromoMonto = parseFloat((totalBruto * (promo.valor / 100)).toFixed(2));
        } else {
          descuentoPromoMonto = promo.valor;
        }
      }
    }

    const descuentoTotal = parseFloat((descuentoFidelidadMonto + descuentoPromoMonto).toFixed(2));
    const totalFinal = Math.max(0, parseFloat((totalBruto - descuentoTotal).toFixed(2)));

    // IVA 16% incluido
    const impuestos = parseFloat((totalFinal * (0.16 / 1.16)).toFixed(2));

    const venta = new Venta({
      items:   itemsVenta,
      subtotal: parseFloat(totalBruto.toFixed(2)),
      impuestos,
      descuentoMonto: descuentoTotal,
      descuentoPorcentaje: descuentoFidelidadPorc, // Registramos fidelidad como porcentaje principal
      promocion: promocionId || null,
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

const obtenerVenta = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cajero',  'nombre email')
      .populate('cliente', 'nombre telefono')
      .populate('promocion', 'nombre valor tipo');

    if (!venta) return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    res.json({ success: true, data: venta });
  } catch (error) {
    next(error);
  }
};

const listarVentas = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const query = { estado: 'completada' };
    if (fechaInicio || fechaFin) {
      query.createdAt = {};
      if (fechaInicio) {
        const start = new Date(fechaInicio);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (fechaFin) {
        const end = new Date(fechaFin);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const ventas = await Venta.find(query)
      .populate('cajero',  'nombre')
      .populate('cliente', 'nombre')
      .populate('promocion', 'nombre')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, total: ventas.length, data: ventas });
  } catch (error) {
    next(error);
  }
};

module.exports = { registrarVenta, obtenerVenta, listarVentas };
