import api from './axios';

/**
 * Obtiene el historial de ventas con filtros opcionales.
 * @param {Object} filtros - { fechaInicio, fechaFin }
 */
export const getHistorialVentas = async (filtros = {}) => {
  const params = new URLSearchParams();
  if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);

  const { data } = await api.get(`/ventas?${params.toString()}`);
  return data;
};

/**
 * Obtiene el detalle de una venta por ID.
 */
export const getDetalleVenta = async (id) => {
  const { data } = await api.get(`/ventas/${id}`);
  return data;
};
