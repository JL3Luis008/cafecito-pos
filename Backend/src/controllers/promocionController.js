const Promocion = require('../models/Promocion');

const getPromociones = async (req, res, next) => {
  try {
    const promos = await Promocion.find().sort({ createdAt: -1 });
    res.json({ success: true, data: promos });
  } catch (error) {
    next(error);
  }
};

const crearPromocion = async (req, res, next) => {
  try {
    const nuevaPromo = new Promocion(req.body);
    await nuevaPromo.save();
    res.status(201).json({ success: true, data: nuevaPromo });
  } catch (error) {
    next(error);
  }
};

const actualizarPromocion = async (req, res, next) => {
  try {
    const promo = await Promocion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!promo) return res.status(404).json({ success: false, error: 'Promoción no encontrada' });
    res.json({ success: true, data: promo });
  } catch (error) {
    next(error);
  }
};

const eliminarPromocion = async (req, res, next) => {
  try {
    const promo = await Promocion.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ success: false, error: 'Promoción no encontrada' });
    res.json({ success: true, message: 'Promoción eliminada' });
  } catch (error) {
    next(error);
  }
};

const getPromocionesVigentes = async (req, res, next) => {
  try {
    const ahora = new Date();
    const promos = await Promocion.find({
      activo: true,
      fechaInicio: { $lte: ahora },
      fechaFin: { $gte: ahora }
    }).sort({ valor: -1 }); // Priorizamos el descuento mayor
    
    res.json({ success: true, data: promos });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion, getPromocionesVigentes };

