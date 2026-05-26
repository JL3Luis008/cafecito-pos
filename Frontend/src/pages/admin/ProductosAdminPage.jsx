import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import Modal from '../../components/ui/Modal';
import ProductoForm from '../../components/productos/ProductoForm';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
const CAT_ICONS = { bebidas: '☕', alimentos: '🥪', postres: '🍰', otros: '📦' };

export default function ProductosAdminPage() {
  const [productos,    setProductos]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [serverError,  setServerError]  = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null); // null = crear
  const [filtro,       setFiltro]       = useState('all');
  const [busqueda,     setBusqueda]     = useState('');
  const formRef = useRef(null); // ref al elemento <form> dentro de ProductoForm

  // ── Fetch ────────────────────────────────────────────────────
  const fetchProductos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/productos?activo=all');
      setProductos(data.data);
    } catch (err) {
      Swal.fire('Error', err.displayMessage ?? 'No se pudieron cargar los productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProductos(); }, []);

  // ── Filtros ──────────────────────────────────────────────────
  const productosFiltrados = productos.filter((p) => {
    const matchEstado =
      filtro === 'all'      ? true    :
      filtro === 'activo'   ? p.activo :
      filtro === 'inactivo' ? !p.activo : true;

    const matchBusqueda = busqueda
      ? p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : true;

    return matchEstado && matchBusqueda;
  });

  // ── Abrir modal ──────────────────────────────────────────────
  const abrirCrear = () => {
    setEditTarget(null);
    setServerError(null);
    setModalOpen(true);
  };

  const abrirEditar = (producto) => {
    setEditTarget(producto);
    setServerError(null);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setServerError(null);
  };

  // ── Submit formulario ────────────────────────────────────────
  const handleSubmit = async (formData) => {
    setSaving(true);
    setServerError(null);
    try {
      if (editTarget) {
        await api.put(`/productos/${editTarget._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Swal.fire({ icon: 'success', title: '¡Producto actualizado!', timer: 1800, showConfirmButton: false });
      } else {
        await api.post('/productos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        Swal.fire({ icon: 'success', title: '¡Producto creado!', timer: 1800, showConfirmButton: false });
      }
      cerrarModal();
      fetchProductos();
    } catch (err) {
      setServerError(err.displayMessage ?? 'Error al guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo ────────────────────────────────────────────
  const handleToggle = async (producto) => {
    const accion = producto.activo ? 'desactivar' : 'activar';
    const { isConfirmed } = await Swal.fire({
      title:             `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} producto?`,
      text:              `"${producto.nombre}" quedará ${producto.activo ? 'oculto en el catálogo' : 'visible en el catálogo'}.`,
      icon:              'question',
      showCancelButton:  true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText:  'Cancelar',
      confirmButtonColor: producto.activo ? '#A51D1D' : '#1D6830',
    });

    if (!isConfirmed) return;

    try {
      await api.patch(`/productos/${producto._id}/toggle`);
      fetchProductos();
    } catch (err) {
      Swal.fire('Error', err.displayMessage, 'error');
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────
  const handleEliminar = async (producto) => {
    const { isConfirmed } = await Swal.fire({
      title:             '¿Eliminar producto?',
      text:              `Esta acción no se puede deshacer. Se eliminará "${producto.nombre}" permanentemente.`,
      icon:              'warning',
      showCancelButton:  true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText:  'Cancelar',
      confirmButtonColor:'#A51D1D',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/productos/${producto._id}`);
      Swal.fire({ icon: 'success', title: 'Producto eliminado', timer: 1500, showConfirmButton: false });
      fetchProductos();
    } catch (err) {
      Swal.fire('Error', err.displayMessage, 'error');
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <>
      <div className="page-header">
        <div className="page-title">
          <h1>📦 Gestión de Productos</h1>
          <p className="text-muted">
            {productos.length} producto{productos.length !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button className="btn btn-primary" onClick={abrirCrear}>
          + Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4" style={{ flexWrap: 'wrap' }}>
        <div className="filter-tabs">
          {[
            { key: 'all',      label: 'Todos' },
            { key: 'activo',   label: '✅ Activos' },
            { key: 'inactivo', label: '⛔ Inactivos' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`filter-tab${filtro === key ? ' active' : ''}`}
              onClick={() => setFiltro(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="search-box">
          <span className="search-box__icon">🔍</span>
          <input
            type="search"
            className="form-control"
            placeholder="Buscar producto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-wrap">
          <div className="spinner" />
          Cargando productos…
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <p className="empty-state__title">
            {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay productos aún'}
          </p>
          <p className="text-muted">
            {busqueda ? 'Intenta con otro término' : 'Comienza agregando el primer producto'}
          </p>
          {!busqueda && (
            <button className="btn btn-primary mt-4" onClick={abrirCrear}>
              + Crear primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((p) => (
                <tr key={p._id} className={!p.activo ? 'inactive' : ''}>
                  <td>
                    {p.imagen ? (
                      <img
                        className="table-img"
                        src={`${SERVER_URL}${p.imagen}`}
                        alt={p.nombre}
                      />
                    ) : (
                      <div className="table-img-placeholder">
                        {CAT_ICONS[p.categoria] ?? '📦'}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="font-medium">{p.nombre}</span>
                  </td>

                  <td>
                    <span className={`badge badge-${p.categoria}`}>
                      {CAT_ICONS[p.categoria]} {p.categoria}
                    </span>
                  </td>

                  <td>
                    <span className="font-bold" style={{ color: 'var(--c-caramel)' }}>
                      ${Number(p.precio).toFixed(2)}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${p.stock <= 5 ? 'badge-danger' : 'badge-primary'}`}>
                      📦 {p.stock ?? 0}
                    </span>
                  </td>

                  <td>
                    <span className={`badge ${p.activo ? 'badge-success' : 'badge-danger'}`}>
                      {p.activo ? '✅ Activo' : '⛔ Inactivo'}
                    </span>
                  </td>

                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => abrirEditar(p)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn btn-sm ${p.activo ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(p)}
                        title={p.activo ? 'Desactivar' : 'Activar'}
                      >
                        {p.activo ? '⛔' : '✅'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleEliminar(p)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        title={editTarget ? `✏️ Editar — ${editTarget.nombre}` : '➕ Nuevo Producto'}
        footer={
          <>
            <button
              className="btn btn-outline"
              onClick={cerrarModal}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              disabled={saving}
              onClick={() =>
              formRef.current?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true })
              )
            }
            >
              {saving ? '⏳ Guardando…' : editTarget ? '💾 Guardar cambios' : '➕ Crear producto'}
            </button>
          </>
        }
      >
          <ProductoForm
            formRef={formRef}
            producto={editTarget}
            onSubmit={handleSubmit}
            loading={saving}
            serverError={serverError}
          />
      </Modal>
    </>
  );
}
