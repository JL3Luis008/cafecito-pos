const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const mongoose = require('mongoose');

// ─── GET /api/reportes/dashboard ──────────────────────────────────────────────
/**
 * Obtiene estadísticas generales para el dashboard.
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total Ventas Hoy
    const ventasHoy = await Venta.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // 2. Total Histórico
    const totalHistorico = await Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // 3. Top 5 Productos más vendidos
    const topProductos = await Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $unwind: '$items' },
      { $group: { 
          _id: '$items.producto', 
          nombre: { $first: '$items.nombre' },
          vendidos: { $sum: '$items.cantidad' },
          ingresos: { $sum: '$items.subtotal' }
      }},
      { $sort: { vendidos: -1 } },
      { $limit: 5 }
    ]);

    // 4. Productos con Stock Bajo (< 5) - Ahora con la lista detallada
    const lowStockItems = await Producto.find({ activo: true, stock: { $lt: 5 } })
      .select('nombre stock categoria')
      .sort({ stock: 1 });

    res.json({
      success: true,
      data: {
        hoy: {
          total: ventasHoy[0]?.total || 0,
          count: ventasHoy[0]?.count || 0
        },
        historico: {
          total: totalHistorico[0]?.total || 0,
          count: totalHistorico[0]?.count || 0
        },
        topProductos,
        stockBajoAlertas: lowStockItems.length,
        lowStockItems // Detalles para el dashboard
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reportes/tendencia ──────────────────────────────────────────────
const getSalesTrend = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tendencia = await Venta.aggregate([
      { $match: { estado: 'completada', createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
          ventas: { $sum: 1 }
      }},
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      success: true,
      data: tendencia
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reportes/categorias ─────────────────────────────────────────────
const getSalesByCategory = async (req, res, next) => {
  try {
    const porCategoria = await Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $unwind: '$items' },
      { $lookup: {
          from: 'productos',
          localField: 'items.producto',
          foreignField: '_id',
          as: 'productoInfo'
      }},
      { $unwind: '$productoInfo' },
      { $group: {
          _id: '$productoInfo.categoria',
          total: { $sum: '$items.subtotal' },
          cantidad: { $sum: '$items.cantidad' }
      }},
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: porCategoria
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reportes/usuarios ──────────────────────────────────────────────
const getSalesByUser = async (req, res, next) => {
  try {
    const ventasPorUsuario = await Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $lookup: {
          from: 'usuarios',
          localField: 'cajero',
          foreignField: '_id',
          as: 'usuarioInfo'
      }},
      { $unwind: '$usuarioInfo' },
      { $group: {
          _id: '$cajero',
          nombre: { $first: '$usuarioInfo.nombre' },
          email: { $first: '$usuarioInfo.email' },
          totalVendido: { $sum: '$total' },
          cantidadVentas: { $sum: 1 }
      }},
      { $sort: { totalVendido: -1 } }
    ]);

    res.json({
      success: true,
      data: ventasPorUsuario
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/reportes/hoy-detalle ───────────────────────────────────────────
const getTodaySalesDetailed = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const ventas = await Venta.find({ 
      estado: 'completada', 
      createdAt: { $gte: startOfDay } 
    })
    .populate('cajero', 'nombre')
    .populate('cliente', 'nombre email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: ventas
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSalesTrend,
  getSalesByCategory,
  getSalesByUser,
  getTodaySalesDetailed
};
