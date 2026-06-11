import axios from './axios';

export const getEstadoCaja = async () => {
  const response = await axios.get('/caja/estado');
  return response.data;
};

export const abrirCaja = async (montoApertura) => {
  const response = await axios.post('/caja/abrir', { montoApertura });
  return response.data;
};

export const realizarCorte = async (montoCierreReal, notas) => {
  const response = await axios.post('/caja/cortar', { montoCierreReal, notas });
  return response.data;
};
