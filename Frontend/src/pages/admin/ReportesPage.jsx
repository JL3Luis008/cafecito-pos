import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, 
  AlertTriangle, Eye, Clock, Heart
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const COLORS = ['#2C1810', '#C8860A', '#6B3A23', '#D4A77A', '#1D6830'];

export default function ReportesPage() {
  const [stats, setStats] = useState(null);
  const [tendencia, setTendencia] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [detalleHoy, setDetalleHoy] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'stock', 'usuarios', 'hoy'

  const fetchData = async () => {
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
      Swal.fire('Error', 'No se pudieron cargar los reportes detallados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

        <div className="stat-card">
          <div className="stat-card__icon primary">
            <TrendingUp size={24} />
          </div>
          <div className="stat-card__content">
            <span className="stat-card__label">Inversión Ventas</span>
            <span className="stat-card__value">${stats.historico.total.toLocaleString()}</span>
            <span className="text-small text-muted">Histórico acumulado</span>
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
        <div className="card-header">
          <h3>Ranking: Los 5 más solicitados</h3>
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
