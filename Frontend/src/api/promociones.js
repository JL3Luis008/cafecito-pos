import axios from './axios';

export const getPromociones = async () => {
  const response = await axios.get('/promociones');
  return response.data;
};

export const crearPromocion = async (promoData) => {
  const response = await axios.post('/promociones', promoData);
  return response.data;
};

export const actualizarPromocion = async (id, promoData) => {
  const response = await axios.put(`/promociones/${id}`, promoData);
  return response.data;
};

export const eliminarPromocion = async (id) => {
  const response = await axios.delete(`/promociones/${id}`);
  return response.data;
};
