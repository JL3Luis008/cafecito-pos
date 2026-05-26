import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import ProductoCard from '../../components/productos/ProductoCard';
import CarritoSidebar from '../../components/ventas/CarritoSidebar';
import { useCart } from '../../context/CartContext';

const CATEGORIAS = ['bebidas', 'alimentos', 'postres', 'otros'];
const CAT_ICONS  = { bebidas: '☕', alimentos: '🥪', postres: '🍰', otros: '📦' };

export default function CatalogoPage() {
  const [productos,  setProductos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [busqueda,   setBusqueda]   = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  
  const { agregarItem } = useCart();

  // Fetch solo productos activos
  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/productos?activo=true');
        setProductos(data.data);
      } catch (err) {
        setError(err.displayMessage ?? 'No se pudo conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  // Filtros con useMemo para evitar recalcular en cada render
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchCat =
        categoriaActiva === 'todas' || p.categoria === categoriaActiva;
      const matchBusqueda = busqueda
        ? p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        : true;
      return matchCat && matchBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  // Agrupar por categoría cuando no hay filtro de categoría
  const productosPorCategoria = useMemo(() => {
    if (categoriaActiva !== 'todas') {
      return { [categoriaActiva]: productosFiltrados };
    }
    return CATEGORIAS.reduce((acc, cat) => {
      const items = productosFiltrados.filter((p) => p.categoria === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    }, {});
  }, [productosFiltrados, categoriaActiva]);

  const totalVisibles = productosFiltrados.length;

  return (
    <div className="catalogo-layout">
      <div className="catalogo-main">
        {/* Header */}
        <div className="page-header mb-4">
        <div className="page-title">
          <h1>🧾 Catálogo</h1>
          <p className="text-muted">
            {loading ? 'Cargando…' : `${totalVisibles} producto${totalVisibles !== 1 ? 's' : ''} disponible${totalVisibles !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Buscador */}
        <div className="search-box">
          <span className="search-box__icon">🔍</span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar en catálogo"
          />
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="filter-tabs mb-4">
        <button
          className={`filter-tab${categoriaActiva === 'todas' ? ' active' : ''}`}
          onClick={() => setCategoriaActiva('todas')}
        >
          Todas
        </button>
        {CATEGORIAS.map((cat) => {
          const count = productos.filter((p) => p.categoria === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={`filter-tab${categoriaActiva === cat ? ' active' : ''}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              <span style={{ opacity: 0.7, marginLeft: '4px', fontSize: '0.7rem' }}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Estados */}
      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          Cargando productos…
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-danger" role="alert">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && totalVisibles === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">
            {busqueda ? '🔍' : '☕'}
          </div>
          <p className="empty-state__title">
            {busqueda
              ? `Sin resultados para "${busqueda}"`
              : 'No hay productos disponibles'}
          </p>
          <p className="text-muted">
            {busqueda
              ? 'Intenta con otro término de búsqueda'
              : 'El administrador aún no ha agregado productos al catálogo'}
          </p>
          {busqueda && (
            <button
              className="btn btn-outline mt-4"
              onClick={() => setBusqueda('')}
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Catálogo agrupado por categoría */}
      {!loading && !error && totalVisibles > 0 && (
        <div>
          {Object.entries(productosPorCategoria).map(([cat, items]) => (
            <section key={cat} className="category-section">
              <div className="category-header">
                <h2>
                  {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </h2>
              </div>
              <div className="catalogo-grid">
                {items.map((producto) => (
                  <ProductoCard
                    key={producto._id}
                    producto={producto}
                    onAgregar={agregarItem}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </div>
      <div className="catalogo-sidebar">
        <CarritoSidebar />
      </div>
    </div>
  );
}
