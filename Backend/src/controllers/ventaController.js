const { validationResult } = require('express-validator');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Promocion = require('../models/Promocion');

// NOTA: calcularPorcentajeDescuento ya no será necesario si migramos todo a Promocion,
// pero lo mantengo por compatibilidad hasta que el usuario cree las promos.

// ─── POST /api/ventas ─────────────────────────────────────────────────────────
/**
 * Registra una venta.
 */
const registrarVenta = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, clienteId, promocionId, metodoPago, efectivoRecibido, cambio } = req.body;

    // 1. Obtener productos activos de la BD
    const productoIds = items.map((i) => i.productoId);
    const productos = await Producto.find({ _id: { $in: productoIds }, activo: true });
    const productoMap = {};
    productos.forEach((p) => { productoMap[p._id.toString()] = p; });

    const itemsVenta = [];
    let subtotalBruto = 0;

    for (const item of items) {
      const producto = productoMap[item.productoId];
      if (!producto || producto.stock < item.cantidad) {
        return res.status(400).json({ success: false, error: `Error con producto ${item.productoId}` });
      }

      const subtotalItem = parseFloat((producto.precio * item.cantidad).toFixed(2));
      subtotalBruto += subtotalItem;

      itemsVenta.push({
        producto: producto._id,
        nombre:   producto.nombre,
        precio:   producto.precio,
        cantidad: item.cantidad,
        subtotal: subtotalItem,
      });
    }

    // 2. Lógica de Descuentos (Manuales y Automáticos)
    let descuentoTotal = 0;
    let promoAplicadaId = null;
    let promoNombre = '';

    const ahora = new Date();
    
    // --- BUSCAR PROMOS VIGENTES ---
    const promosVigentes = await Promocion.find({
      activo: true,
      $or: [
        { esPermanente: true },
        { fechaInicio: { $lte: ahora }, fechaFin: { $gte: ahora } }
      ]
    });


    let clienteObj = null;
    if (clienteId) {
      clienteObj = await Cliente.findById(clienteId);
    }

    // A. Si hay promo Manual seleccionada
    let promoManual = null;
    if (promocionId) {
      promoManual = promosVigentes.find(p => p._id.toString() === promocionId && p.aplicacion === 'manual');
    }

    // B. Buscar Promos Automáticas que apliquen
    const promosAuto = promosVigentes.filter(p => {
      if (p.aplicacion !== 'automatica') return false;
      if (p.criterio === 'general') return true;
      if (p.criterio === 'cliente_frecuente' && clienteObj) {
        const compras = clienteObj.comprasRealizadas || 0;
        const cumpleMin = compras >= (p.minimoCompras || 0);
        const cumpleMax = !p.maximoCompras || p.maximoCompras === 0 || compras <= p.maximoCompras;
        return cumpleMin && cumpleMax;
      }
      return false;
    });

    // C. Decidir cuál aplicar (Prioridad: Manual > Automática con mayor ahorro)
    let promoElegida = promoManual;
    
    // Si no hay manual, o si una automática da más descuento, recalculamos
    // Para simplificar, si el usuario seleccionó una manual, respetamos esa.
    // Si no, buscamos la mejor automática.
    if (!promoElegida && promosAuto.length > 0) {
      // Ordenar por valor (asumiendo que son porcentajes mayoritariamente)
      promosAuto.sort((a, b) => b.valor - a.valor);
      promoElegida = promosAuto[0];
    }

    if (promoElegida) {
      promoAplicadaId = promoElegida._id;
      promoNombre = promoElegida.nombre;
      if (promoElegida.tipo === 'porcentaje') {
        descuentoTotal = parseFloat((subtotalBruto * (promoElegida.valor / 100)).toFixed(2));
      } else {
        descuentoTotal = promoElegida.valor;
      }
    }

    const totalFinal = Math.max(0, parseFloat((subtotalBruto - descuentoTotal).toFixed(2)));
    const impuestos = parseFloat((totalFinal * (0.16 / 1.16)).toFixed(2));

    const venta = new Venta({
      items:   itemsVenta,
      subtotal: parseFloat(subtotalBruto.toFixed(2)),
      impuestos,
      descuentoMonto: descuentoTotal,
      promocion: promoAplicadaId,
      total: totalFinal,
      metodoPago: metodoPago || 'efectivo',
      efectivoRecibido: efectivoRecibido || 0,
      cambio: cambio || 0,
      cajero: req.user?.id,
      cliente: clienteId || null,
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

    if (clienteId) {
      await Cliente.findByIdAndUpdate(clienteId, { $inc: { comprasRealizadas: 1 } });
    }

    res.status(201).json({ success: true, data: venta, promoNombre });
  } catch (error) {
    next(error);
  }
};

const obtenerVenta = async (req, res, next) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cajero', 'nombre')
      .populate('cliente', 'nombre')
      .populate('promocion', 'nombre valor tipo');
    res.json({ success: true, data: venta });
  } catch (error) { next(error); }
};

const listarVentas = async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin, cajero, metodoPago } = req.query;
    const query = { estado: 'completada' };
    if (fechaInicio || fechaFin) {
      query.createdAt = {};
      if (fechaInicio) query.createdAt.$gte = new Date(fechaInicio);
      if (fechaFin) {
        const end = new Date(fechaFin);
        end.setHours(23, 59, 59);
        query.createdAt.$lte = end;
      }
    }
    if (cajero) query.cajero = cajero;
    if (metodoPago) query.metodoPago = metodoPago;
    const ventas = await Venta.find(query)
      .populate('cajero', 'nombre')
      .populate('cliente', 'nombre')
      .populate('promocion', 'nombre')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ventas });
  } catch (error) { next(error); }
};

module.exports = { registrarVenta, obtenerVenta, listarVentas };
