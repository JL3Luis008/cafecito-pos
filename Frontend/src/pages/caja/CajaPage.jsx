import React, { useState, useEffect } from 'react';
import { getEstadoCaja, abrirCaja, realizarCorte } from '../../api/caja';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';

export default function CajaPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cajaInfo, setCajaInfo] = useState(null);
  const [isAbierta, setIsAbierta] = useState(false);
  
  // States for forms
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierreReal, setMontoCierreReal] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    fetchEstadoCaja();
  }, []);

  const fetchEstadoCaja = async () => {
    try {
      setLoading(true);
      const res = await getEstadoCaja();
      setIsAbierta(res.isCajaAbierta);
      setCajaInfo(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    try {
      const res = await abrirCaja(montoApertura);
      setIsAbierta(true);
      setCajaInfo(res.data);
      Swal.fire('Caja Abierta', 'Turno iniciado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo abrir la caja', 'error');
    }
  };

  const handleRealizarCorte = async (e) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: '¿Confirmar Corte de Caja?',
      text: "Se cerrará el turno actual y se guardarán los resultados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cerrar Caja',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await realizarCorte(montoCierreReal, notas);
        setIsAbierta(false);
        setCajaInfo(res.data); // Mostrar resumen final
        Swal.fire('Corte Realizado', 'El turno ha sido cerrado con éxito.', 'success');
      } catch (error) {
        Swal.fire('Error', error.response?.data?.error || 'No se pudo realizar el corte', 'error');
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando estado de caja...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-gray-800">Gestión de Caja</h1>
        <p className="text-gray-500 text-lg">Control de turnos y arqueo de efectivo.</p>
      </header>

      {!isAbierta ? (
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 animate-in">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">💰</div>
            <div>
              <h3 className="text-xl font-bold">Caja Cerrada</h3>
              <p className="text-gray-500">Inicia un nuevo turno para registrar ventas.</p>
            </div>
          </div>
          
          <form onSubmit={handleAbrirCaja} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Fondo Inicial de Caja</label>
              <input 
                type="number" 
                step="0.01"
                required
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold focus:border-caramel outline-none transition-all"
                placeholder="0.00"
                value={montoApertura}
                onChange={(e) => setMontoApertura(e.target.value)}
              />
              <p className="mt-2 text-xs text-gray-400 italic">Este es el efectivo disponible para dar cambio al iniciar.</p>
            </div>
            
            <button 
              type="submit"
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-colors shadow-lg active:scale-95"
            >
              Abrir Turno de Caja
            </button>
          </form>

          {cajaInfo && cajaInfo.estado === 'cerrado' && (
             <div className="mt-8 pt-8 border-top-2 border-dashed border-gray-200">
                <h4 className="font-bold text-gray-400 uppercase text-xs mb-4">Resumen del Último Corte</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="block text-xs font-bold text-gray-400">VENTAS SISTEMA</span>
                      <span className="text-lg font-black">${cajaInfo.ventasSistema.total.toFixed(2)}</span>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="block text-xs font-bold text-gray-400">EFECTIVO REAL</span>
                      <span className="text-lg font-black">${cajaInfo.montoCierreReal.toFixed(2)}</span>
                   </div>
                   <div className={`p-4 rounded-2xl ${cajaInfo.diferencia === 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      <span className="block text-xs font-bold opacity-60">DIFERENCIA</span>
                      <span className="text-lg font-black">${cajaInfo.diferencia.toFixed(2)}</span>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl">
                      <span className="block text-xs font-bold text-gray-400">SALDO FINAL</span>
                      <span className="text-lg font-black">${(cajaInfo.montoCierreReal).toFixed(2)}</span>
                   </div>
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dashboard de Turno Abierto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-caramel-lt">
              <span className="text-caramel font-bold text-xs uppercase">Turno en Curso</span>
              <h3 className="text-2xl font-black mb-2">{user?.nombre}</h3>
              <p className="text-gray-400 text-sm">Iniciado el {new Date(cajaInfo.fechaApertura).toLocaleString()}</p>
              
              <div className="mt-6 flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <span className="font-bold text-gray-600">Monto Inicial:</span>
                <span className="text-xl font-black text-gray-800">${cajaInfo.montoApertura.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-espresso p-8 rounded-3xl shadow-lg text-white">
              <span className="text-caramel-lt font-bold text-xs uppercase">Recordatorio de Seguridad</span>
              <h3 className="text-xl font-bold mt-2">Cierre de Caja Obligatorio</h3>
              <p className="text-caramel-lt opacity-80 text-sm mt-2">Por favor, realiza el arqueo físico de efectivo antes de cerrar el sistema.</p>
            </div>
          </div>

          <form onSubmit={handleRealizarCorte} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
             <h3 className="text-xl font-bold mb-6">Realizar Arqueo y Corte</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Efectivo Contado Fisicamente</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-bold focus:border-red-400 outline-none transition-all"
                    placeholder="Suma de billetes y monedas"
                    value={montoCierreReal}
                    onChange={(e) => setMontoCierreReal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase mb-2">Notas u Observaciones</label>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-caramel outline-none transition-all"
                    rows="3"
                    placeholder="Ej: Faltante por error en cambio..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  ></textarea>
                </div>
             </div>

             <button 
                type="submit"
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 active:scale-95"
              >
                Cerrar Turno y Realizar Corte
              </button>
          </form>
        </div>
      )}
    </div>
  );
}
