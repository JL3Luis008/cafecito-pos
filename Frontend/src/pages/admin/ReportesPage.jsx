import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, 
  AlertTriangle, Eye, Clock, Heart, Download,
  Calendar, Search
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { getHistorialVentas } from '../../api/ventas';
import TicketModal from '../../components/ventas/TicketModal';

const COLORS = ['#2C1810', '#C8860A', '#6B3A23', '#D4A77A', '#1D6830'];

export default function ReportesPage() {
  const [stats, setStats] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalleHoy, setDetalleHoy] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'stock', 'usuarios', 'hoy', 'historico'

  // Historial modal state
  const [historialVentas, setHistorialVentas] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    fechaInicio: '',
    fechaFin: '',
    cajero: '',
    metodoPago: ''
  });
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const downloadCSV = (data, filename) => {
    if (!data || !data.length) return;
    
    // Generar cabeceras a partir de las llaves del primer objeto
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => {
      return Object.values(item).map(val => {
        // Escapar comas y limpiar valores
        let cleanVal = val === null || val === undefined ? '' : String(val);
        if (cleanVal.includes(',')) cleanVal = `"${cleanVal}"`;
        return cleanVal;
      }).join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarResumenHoy = () => {
    const dataExport = detalleHoy.map(v => ({
      Folio: v.folio,
      Fecha: new Date(v.createdAt).toLocaleDateString(),
      Hora: new Date(v.createdAt).toLocaleTimeString(),
      Cliente: v.cliente?.nombre || 'General',
      Cajero: v.cajero?.nombre || 'N/A',
      Metodo: v.metodoPago,
      Total: v.total
    }));
    downloadCSV(dataExport, 'ventas_hoy');
  };

  const exportarRankingProductos = () => {
    const dataExport = stats.topProductos.map(p => ({
      Nombre: p.nombre,
      Vendidos: p.vendidos,
      Ingresos: p.ingresos
    }));
    downloadCSV(dataExport, 'ranking_productos');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStats, resTendencia, resCats, resUsers, resHoy, resClientes] = await Promise.all([
        api.get('/reportes/dashboard'),
        api.get('/reportes/tendencia'),
        api.get('/reportes/categorias'),
        api.get('/reportes/usuarios'),
        api.get('/reportes/hoy-detalle'),
        api.get('/clientes')
      ]);

      setStats(resStats.data.data);
      setTendencia(resTendencia.data.data);
      setCategorias(resCats.data.data);
      setUsuarios(resUsers.data.data);
      setDetalleHoy(resHoy.data.data);
      setClientes(resClientes.data.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los reportes detallados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchData();
  }, []);

  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await getHistorialVentas(filtrosHistorial);
      setHistorialVentas(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo cargar el historial', 'error');
    } finally {
      setLoadingHistorial(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'historico') {
      fetchHistorial();
    }
  }, [activeModal]);


  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner"></div>
        <span>Cargando análisis profundo...</span>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <header className="page-header">
        <div className="page-title">
          <h1>Reportes y Análisis</h1>
          <p className="text-muted">Desempeño del POS — Cafecito Feliz</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={() => fetchData()}>
            Actualizar Datos
          </button>
        </div>
      </header>

      {/* Grid de KPIs con Acciones de Detalle */}
      <section className="stats-grid">
        <div className="stat-card cursor-pointer" onClick={() => setActiveModal('hoy')}>
          <div className="stat-card__icon success">
            <DollarSign size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Ventas Hoy</span>
            <span className="stat-card__value">${stats.hoy.total.toLocaleString()}</span>
            <span className="text-small text-muted flex items-center gap-1">
              Ver {stats.hoy.count} tickets <Eye size={12} />
            </span>
          </div>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveModal('historico')}>
          <div className="stat-card__icon primary">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Inversión Ventas</span>
            <span className="stat-card__value">${stats.historico.total.toLocaleString()}</span>
            <span className="text-small text-muted flex items-center gap-1">
              Histórico acumulado <Eye size={12} />
            </span>
          </div>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveModal('usuarios')}>
          <div className="stat-card__icon info">
            <Users size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Ventas por Cajero</span>
            <span className="stat-card__value">{usuarios.length}</span>
            <span className="text-small text-muted flex items-center gap-1">
              Ver desempeño <Eye size={12} />
            </span>
          </div>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveModal('stock')}>
          <div className="stat-card__icon danger">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Alertas Stock</span>
            <span className="stat-card__value">{stats.stockBajoAlertas}</span>
            <span className="text-small text-danger flex items-center gap-1 font-bold">
              Detalle crítico <Eye size={12} />
            </span>
          </div>
        </div>

        <div className="stat-card cursor-pointer" onClick={() => setActiveModal('clientes')}>
          <div className="stat-card__icon warning">
            <Heart size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Clientes Fieles</span>
            <span className="stat-card__value">{clientes.length}</span>
            <span className="text-small text-muted flex items-center gap-1">
              Top recurrentes <Eye size={12} />
            </span>
          </div>
        </div>
      </section>

      {/* Gráficas Principales */}
      <div className="reports-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Tendencia Semanal</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={tendencia}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8860A" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#C8860A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#C8860A" strokeWidth={3} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Categorías</h3>
          </div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categorias} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total" nameKey="_id">
                  {categorias.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking de Productos */}
      <div className="card mt-4">
        <div className="card-header flex justify-between items-center">
          <h3>Ranking: Los 5 más solicitados</h3>
          <button className="btn btn-outline btn-sm" onClick={exportarRankingProductos}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
        <div className="card-body">
          <div className="top-products-list">
            {stats.topProductos.map((prod, idx) => (
              <div key={prod._id} className="product-rank-item">
                <div className="rank-number">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold">{prod.nombre}</h4>
                    <span className="font-bold text-success">${prod.ingresos.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-small text-muted">
                    <span>{prod.vendidos} unidades</span>
                    <span>Progreso vs Lider</span>
                  </div>
                  <div className="w-full bg-mist mt-1" style={{ height: 6, borderRadius: 3 }}>
                    <div 
                      className="bg-caramel" 
                      style={{ height: '100%', borderRadius: 3, width: `${(prod.vendidos / stats.topProductos[0].vendidos) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: DETALLE STOCK */}
      {activeModal === 'stock' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title flex items-center gap-2">
                <AlertTriangle size={20} className="text-danger" />
                Insumos por Agotarse
              </h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockItems.map(item => (
                    <tr key={item._id}>
                      <td className="font-bold">{item.nombre}</td>
                      <td><span className={`badge badge-${item.categoria}`}>{item.categoria}</span></td>
                      <td>
                        <span className="badge badge-danger" style={{ fontSize: '1rem', padding: '4px 12px' }}>
                          {item.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stats.lowStockItems.length === 0 && (
                    <tr><td colSpan="3" className="text-center py-4">Todo el inventario está en niveles óptimos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VENTAS POR CAJERO */}
      {activeModal === 'usuarios' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2 className="modal-title">Desempeño por Cajer@</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Cajero</th>
                    <th>Tickets</th>
                    <th className="text-right">Total Vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u._id}>
                      <td className="font-bold">{u.nombre}</td>
                      <td>{u.cantidadVentas}</td>
                      <td className="text-right font-bold text-success">${u.totalVendido.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE HOY */}
      {activeModal === 'hoy' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2 className="modal-title">Tickets de Hoy ({detalleHoy.length})</h2>
              <div className="flex gap-2 mr-8">
                <button className="btn btn-caramel btn-sm" onClick={exportarResumenHoy}>
                  <Download size={14} /> Exportar CSV
                </button>
              </div>
              <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Cajero</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detalleHoy.map(v => (
                    <tr key={v._id}>
                      <td className="font-bold text-caramel">{v.folio}</td>
                      <td>
                        <span className="flex items-center gap-1 text-small text-muted">
                          <Clock size={12} />
                          {new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>{v.cliente?.nombre || 'General'}</td>
                      <td>{v.cajero?.nombre}</td>
                      <td className="text-right font-bold">${v.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO ACUMULADO */}
      {activeModal === 'historico' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 1000, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Histórico de Ventas</h2>
              <div className="flex gap-2 mr-8">
                <button className="btn btn-caramel btn-sm" onClick={() => {
                  const dataExport = historialVentas.map(v => ({
                    Folio: v.folio,
                    Fecha: new Date(v.createdAt).toLocaleDateString(),
                    Hora: new Date(v.createdAt).toLocaleTimeString(),
                    Cajero: v.cajero?.nombre || 'N/A',
                    Cliente: v.cliente?.nombre || 'General',
                    Metodo: v.metodoPago,
                    Total: v.total
                  }));
                  downloadCSV(dataExport, 'historico_ventas');
                }}>
                  <Download size={14} /> Exportar CSV
                </button>
              </div>
              <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Filtros */}
              <section className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="form-group min-w-[180px]">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Desde</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        className="form-control pl-10" 
                        value={filtrosHistorial.fechaInicio}
                        onChange={(e) => setFiltrosHistorial({...filtrosHistorial, fechaInicio: e.target.value})}
                      />
                      <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                  </div>
                  <div className="form-group min-w-[180px]">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Hasta</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        className="form-control pl-10" 
                        value={filtrosHistorial.fechaFin}
                        onChange={(e) => setFiltrosHistorial({...filtrosHistorial, fechaFin: e.target.value})}
                      />
                      <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                  </div>
                  <div className="form-group min-w-[180px]">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Cajero</label>
                    <select 
                      className="form-control"
                      value={filtrosHistorial.cajero}
                      onChange={(e) => setFiltrosHistorial({...filtrosHistorial, cajero: e.target.value})}
                    >
                      <option value="">Todos</option>
                      {usuarios.map(u => (
                        <option key={u._id} value={u._id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group min-w-[180px]">
                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Método de Pago</label>
                    <select 
                      className="form-control"
                      value={filtrosHistorial.metodoPago}
                      onChange={(e) => setFiltrosHistorial({...filtrosHistorial, metodoPago: e.target.value})}
                    >
                      <option value="">Todos</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary px-6 flex items-center gap-2" onClick={fetchHistorial}>
                      <Search size={16} />
                      Filtrar
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      onClick={() => {
                        setFiltrosHistorial({ fechaInicio: '', fechaFin: '', cajero: '', metodoPago: '' });
                        setTimeout(() => fetchHistorial(), 0);
                      }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
              </section>

              {/* Tabla */}
              <div className="table-responsive">
                <table className="table w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left p-3 text-xs font-bold text-gray-400 uppercase">Folio</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-400 uppercase">Fecha / Hora</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-400 uppercase">Cajero</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-400 uppercase">Cliente</th>
                      <th className="text-left p-3 text-xs font-bold text-gray-400 uppercase">Método</th>
                      <th className="text-right p-3 text-xs font-bold text-gray-400 uppercase">Total</th>
                      <th className="text-center p-3 text-xs font-bold text-gray-400 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingHistorial ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="spinner"></div>
                            Cargando historial...
                          </div>
                        </td>
                      </tr>
                    ) : historialVentas.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-gray-400 italic">
                          No se encontraron ventas para este periodo.
                        </td>
                      </tr>
                    ) : historialVentas.map((venta) => (
                      <tr key={venta._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-black text-caramel">{venta.folio}</td>
                        <td className="p-3 text-sm">
                          {new Date(venta.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="p-3 text-sm font-medium">{venta.cajero?.nombre || 'N/A'}</td>
                        <td className="p-3 text-sm">{venta.cliente?.nombre || 'Venta General'}</td>
                        <td className="p-3 capitalize">
                          <span className={`badge ${venta.metodoPago === 'efectivo' ? 'badge-success' : 'badge-info'}`}>
                            {venta.metodoPago === 'efectivo' ? '💵' : '💳'} {venta.metodoPago}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-gray-800">
                          ${venta.total.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <button 
                              className="p-2 bg-mist hover:bg-caramel-lt rounded-xl text-caramel transition-all active:scale-90"
                              onClick={() => {
                                setSelectedVenta(venta);
                                setIsTicketModalOpen(true);
                              }}
                              title="Ver Ticket"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Venta */}
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        venta={selectedVenta} 
      />

      {/* MODAL: CLIENTES FIELES */}
      {activeModal === 'clientes' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2 className="modal-title">Ranking de Clientes (Fidelidad)</h2>
              <button className="modal-close" onClick={() => setActiveModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Nivel</th>
                    <th className="text-right">Compras</th>
                  </tr>
                </thead>
                <tbody>
                  {[...clientes].sort((a, b) => (b.comprasRealizadas || 0) - (a.comprasRealizadas || 0)).map(c => {
                    const compras = c.comprasRealizadas || 0;
                    let desc = 'Sin nivel';
                    let badge = 'muted';
                    if (compras >= 1 && compras <= 3) { desc = 'Trial (5%)'; badge = 'info'; }
                    else if (compras >= 4 && compras <= 7) { desc = 'Weekly (10%)'; badge = 'success'; }
                    else if (compras >= 8) { desc = 'VIP (15%)'; badge = 'warning'; }

                    return (
                      <tr key={c._id}>
                        <td>
                          <div className="font-bold">{c.nombre}</div>
                          <div className="text-small text-muted">{c.email || 'Sin correo'}</div>
                        </td>
                        <td>{c.telefono}</td>
                        <td>
                          <span className={`badge badge-${badge}`}>{desc}</span>
                        </td>
                        <td className="text-right">
                          <span className="font-bold text-lg">{compras}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {clientes.length === 0 && (
                    <tr><td colSpan="4" className="text-center py-4">No hay clientes registrados aún.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
