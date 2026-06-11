const CorteCaja = require('../models/CorteCaja');
const Venta = require('../models/Venta');

// ─── POST /api/caja/abrir ─────────────────────────────────────────────────────
const abrirCaja = async (req, res, next) => {
  try {
    const { montoApertura } = req.body;

    // Verificar si ya tiene un turno abierto
    const turnoExistente = await CorteCaja.findOne({ 
      cajero: req.user.id, 
      estado: 'abierto' 
    });

    if (turnoExistente) {
      return res.status(400).json({ 
        success: false, 
        error: 'Ya tienes un turno de caja abierto' 
      });
    }

    const nuevoCorte = new CorteCaja({
      cajero: req.user.id,
      montoApertura: parseFloat(montoApertura) || 0,
      estado: 'abierto'
    });

    await nuevoCorte.save();
    res.status(201).json({ success: true, data: nuevoCorte });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/caja/cortar ─────────────────────────────────────────────────────
const realizarCorte = async (req, res, next) => {
  try {
    const { montoCierreReal, notas } = req.body;

    // 1. Buscar turno abierto
    const turno = await CorteCaja.findOne({ 
      cajero: req.user.id, 
      estado: 'abierto' 
    });

    if (!turno) {
      return res.status(404).json({ success: false, error: 'No hay un turno abierto para cerrar' });
    }

    // 2. Calcular ventas desde la apertura hasta ahora
    const ventas = await Venta.find({
      cajero: req.user.id,
      estado: 'completada',
      createdAt: { $gte: turno.fechaApertura }
    });

    const resumen = ventas.reduce((acc, v) => {
      acc[v.metodoPago] = (acc[v.metodoPago] || 0) + v.total;
      acc.total += v.total;
      return acc;
    }, { efectivo: 0, tarjeta: 0, transferencia: 0, total: 0 });

    // 3. Cálculos de auditoría
    // Lo que debería haber en efectivo = monto inicial + ventas en efectivo
    const efectivoEsperado = turno.montoApertura + resumen.efectivo;
    const diferencia = (parseFloat(montoCierreReal) || 0) - efectivoEsperado;

    // 4. Actualizar Corte
    turno.fechaCierre = new Date();
    turno.ventasSistema = resumen;
    turno.montoCierreReal = parseFloat(montoCierreReal) || 0;
    turno.diferencia = diferencia;
    turno.estado = 'cerrado';
    turno.notas = notas;

    await turno.save();

    res.json({ success: true, data: turno });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/caja/estado ─────────────────────────────────────────────────────
const obtenerEstadoCaja = async (req, res, next) => {
  try {
    const turno = await CorteCaja.findOne({ 
      cajero: req.user.id, 
      estado: 'abierto' 
    });

    res.json({ 
      success: true, 
      isCajaAbierta: !!turno,
      data: turno 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { abrirCaja, realizarCorte, obtenerEstadoCaja };
