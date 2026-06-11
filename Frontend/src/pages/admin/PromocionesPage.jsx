import React, { useState, useEffect } from 'react';
import { getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } from '../../api/promociones';
import Swal from 'sweetalert2';

export default function PromocionesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: '',
    fechaInicio: '',
    fechaFin: '',
    activo: true
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await getPromociones();
      setPromos(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        nombre: promo.nombre,
        descripcion: promo.descripcion,
        tipo: promo.tipo,
        valor: promo.valor,
        fechaInicio: promo.fechaInicio.split('T')[0],
        fechaFin: promo.fechaFin.split('T')[0],
        activo: promo.activo
      });
    } else {
      setEditingPromo(null);
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'porcentaje',
        valor: '',
        fechaInicio: '',
        fechaFin: '',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPromo) {
        await actualizarPromocion(editingPromo._id, formData);
        Swal.fire('¡Éxito!', 'Promoción actualizada', 'success');
      } else {
        await crearPromocion(formData);
        Swal.fire('¡Éxito!', 'Promoción creada', 'success');
      }
      setShowModal(false);
      fetchPromos();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Error al procesar', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await eliminarPromocion(id);
        fetchPromos();
        Swal.fire('Eliminado', 'La promoción ha sido eliminada', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Promociones</h1>
          <p className="text-gray-500">Configura descuentos y ofertas temporales.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
        >
          + Nueva Promoción
        </button>
      </header>

      {loading ? (
        <div className="text-center p-12">Cargando promociones...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promos.map(promo => (
            <div key={promo._id} className={`bg-white p-6 rounded-3xl shadow-sm border ${promo.activo ? 'border-gray-100' : 'border-gray-200 opacity-60'} hover:shadow-md transition-shadow relative overflow-hidden group`}>
              {new Date() > new Date(promo.fechaFin) && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest transform rotate-45 translate-x-4 translate-y-2">Expirada</div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${promo.tipo === 'porcentaje' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                  {promo.tipo === 'porcentaje' ? '%' : '$'}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(promo)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors">✏️</button>
                  <button onClick={() => handleDelete(promo._id)} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors">🗑️</button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{promo.nombre}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{promo.descripcion}</p>
              
              <div className="space-y-2 pt-4 border-t border-gray-50">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Valor</span>
                  <span className="text-lg font-black">{promo.tipo === 'porcentaje' ? `${promo.valor}%` : `$${promo.valor}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase">Validez</span>
                  <span className="text-xs font-medium text-gray-600">
                    {new Date(promo.fechaInicio).toLocaleDateString()} - {new Date(promo.fechaFin).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4 animate-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold">{editingPromo ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✖</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre de la Promo</label>
                  <input 
                    type="text" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                  <textarea 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    rows="2"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Descuento Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor</label>
                  <input 
                    type="number" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desde</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hasta</label>
                  <input 
                    type="date" 
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-caramel"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({...formData, fechaFin: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                    <input 
                      type="checkbox" 
                      id="promo-activo"
                      className="w-5 h-5 rounded border-gray-300"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    <label htmlFor="promo-activo" className="text-sm font-bold text-gray-700">Promoción Activa</label>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  {editingPromo ? 'Guardar Cambios' : 'Crear Promoción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
