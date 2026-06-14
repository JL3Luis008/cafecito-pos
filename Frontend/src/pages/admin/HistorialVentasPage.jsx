import { useState, useEffect } from 'react';
import { getHistorialVentas } from '../../api/ventas';
import { Calendar, Search, Eye, Filter, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import TicketModal from '../../components/ventas/TicketModal';

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: ''
  });
  
  // Para el detalle de venta
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const res = await getHistorialVentas(filtros);
      setVentas(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchHistorial();
  };

  const openVentaDetalle = (venta) => {
    setSelectedVenta(venta);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 animate-in">
      <header className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="page-title">
          <h1 className="text-3xl font-black text-gray-800">Historial de Ventas</h1>
          <p className="text-muted">Consulta y auditoría de tickets emitidos.</p>
        </div>
      </header>

      {/* Barra de Filtros */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-6">
          <div className="form-group min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Desde</label>
            <div className="relative">
               <input 
                type="date" 
                className="form-control pl-10" 
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros({...filtros, fechaInicio: e.target.value})}
              />
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>
          
          <div className="form-group min-w-[200px]">
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Hasta</label>
            <div className="relative">
              <input 
                type="date" 
                className="form-control pl-10" 
                value={filtros.fechaFin}
                onChange={(e) => setFiltros({...filtros, fechaFin: e.target.value})}
              />
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary px-8 flex items-center gap-2">
              <Search size={18} />
              Filtrar
            </button>
            <button 
              type="button" 
              className="btn btn-outline"
              onClick={() => {
                setFiltros({ fechaInicio: '', fechaFin: '' });
                // Re-fetch sin filtros
                setTimeout(() => fetchHistorial(), 0);
              }}
            >
              Limpiar
            </button>
          </div>
        </form>
      </section>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="table-responsive">
          <table className="table w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase">Folio</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase">Fecha / Hora</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase">Cajero</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase">Cliente</th>
                <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase">Método</th>
                <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase">Total</th>
                <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-500">
                     <div className="flex flex-col items-center gap-2">
                        <div className="spinner"></div>
                        Cargando historial...
                     </div>
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-gray-400 italic">
                    No se encontraron ventas para este periodo.
                  </td>
                </tr>
              ) : ventas.map((venta) => (
                <tr key={venta._id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-black text-caramel">{venta.folio}</td>
                  <td className="p-4 text-sm">
                    {new Date(venta.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-4 text-sm font-medium">{venta.cajero?.nombre || 'N/A'}</td>
                  <td className="p-4 text-sm">{venta.cliente?.nombre || 'Venta General'}</td>
                  <td className="p-4 capitalize">
                    <span className={`badge ${venta.metodoPago === 'efectivo' ? 'badge-success' : 'badge-info'}`}>
                      {venta.metodoPago === 'efectivo' ? '💵' : '💳'} {venta.metodoPago}
                    </span>
                  </td>
                  <td className="p-4 text-right font-black text-gray-800">
                    ${venta.total.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                       <button 
                        className="p-2 bg-mist hover:bg-caramel-lt rounded-xl text-caramel transition-all active:scale-90"
                        onClick={() => openVentaDetalle(venta)}
                        title="Ver Ticket"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle */}
      <TicketModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        venta={selectedVenta} 
      />
    </div>
  );
}
