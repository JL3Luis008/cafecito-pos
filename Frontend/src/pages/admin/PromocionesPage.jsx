import React, { useState, useEffect } from 'react';
import { getPromociones, crearPromocion, actualizarPromocion, eliminarPromocion } from '../../api/promociones';
import Swal from 'sweetalert2';

export default function PromocionesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  const defaultForm = {
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje',
    valor: '',
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    aplicacion: 'manual',
    criterio: 'general',
    minimoCompras: 0,
    maximoCompras: 0,
    esPermanente: false
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    try {
      const res = await getPromociones();
      setPromos(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData({
        nombre: promo.nombre,
        descripcion: promo.descripcion || '',
        tipo: promo.tipo,
        valor: promo.valor,
        fechaInicio: promo.fechaInicio ? promo.fechaInicio.split('T')[0] : '',
        fechaFin: promo.fechaFin ? promo.fechaFin.split('T')[0] : '',
        activo: promo.activo,
        aplicacion: promo.aplicacion || 'manual',
        criterio: promo.criterio || 'general',
        minimoCompras: promo.minimoCompras || 0,
        maximoCompras: promo.maximoCompras || 0,
        esPermanente: promo.esPermanente || false
      });
    } else {
      setEditingPromo(null);
      setFormData(defaultForm);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.esPermanente) {
        delete payload.fechaInicio;
        delete payload.fechaFin;
      }
      if (editingPromo) {
        await actualizarPromocion(editingPromo._id, payload);
        Swal.fire({ icon: 'success', title: 'Promoción actualizada', timer: 1500, showConfirmButton: false });
      } else {
        await crearPromocion(payload);
        Swal.fire({ icon: 'success', title: 'Promoción creada', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false);
      fetchPromos();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Error al procesar', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar promoción?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#c0392b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if (result.isConfirmed) {
      try {
        await eliminarPromocion(id);
        fetchPromos();
        Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1200, showConfirmButton: false });
      } catch { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
    }
  };

  const handleToggleActivo = async (promo) => {
    try {
      await actualizarPromocion(promo._id, { activo: !promo.activo });
      fetchPromos();
    } catch { Swal.fire('Error', 'No se pudo cambiar el estado', 'error'); }
  };

  const isVigente = (p) => {
    if (!p.activo) return false;
    if (p.esPermanente) return true;
    const now = new Date();
    return new Date(p.fechaInicio) <= now && new Date(p.fechaFin) >= now;
  };

  return (
    <div className="animate-in" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <header className="page-header">
        <div className="page-title">
          <h1>Promociones y Descuentos</h1>
          <p className="text-muted">Configura ofertas automáticas por fidelidad o manuales para la caja.</p>
        </div>
        <button className="btn btn-caramel" onClick={() => handleOpenModal()}>
          + Nueva Promoción
        </button>
      </header>

      {loading ? (
        <div className="loading-wrap"><div className="spinner"></div><span>Cargando...</span></div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#999' }}>
          <p style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎁</p>
          <p style={{ fontWeight: 700 }}>No hay promociones creadas</p>
          <p style={{ fontSize: '0.85rem' }}>Crea tu primera promoción para ofrecer descuentos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {promos.map(promo => {
            const vigente = isVigente(promo);
            return (
              <div
                key={promo._id}
                style={{
                  background: 'var(--c-surface)',
                  border: `2px solid ${vigente ? 'var(--c-caramel)' : '#e5e5e5'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  position: 'relative',
                  opacity: promo.activo ? 1 : 0.55,
                  transition: 'all 0.25s ease',
                  boxShadow: vigente ? '0 4px 20px rgba(200,134,10,0.12)' : '0 1px 4px rgba(0,0,0,0.06)'
                }}
              >
                {/* Badges superiores */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                    padding: '3px 10px', borderRadius: 20,
                    background: promo.aplicacion === 'automatica' ? '#d1fae5' : '#f3f4f6',
                    color: promo.aplicacion === 'automatica' ? '#065f46' : '#6b7280'
                  }}>
                    {promo.aplicacion === 'automatica' ? '⚡ Automática' : '✋ Manual'}
                  </span>

                  {promo.criterio === 'cliente_frecuente' && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '3px 10px', borderRadius: 20, background: '#dbeafe', color: '#1e40af'
                    }}>
                      🏅 Fidelidad {promo.minimoCompras}
                      {promo.maximoCompras > 0 ? `–${promo.maximoCompras}` : '+'} compras
                    </span>
                  )}

                  {promo.esPermanente ? (
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '3px 10px', borderRadius: 20, background: '#fef3c7', color: '#92400e'
                    }}>∞ Permanente</span>
                  ) : !promo.activo ? null : new Date() > new Date(promo.fechaFin) ? (
                    <span style={{
                      fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                      padding: '3px 10px', borderRadius: 20, background: '#fee2e2', color: '#991b1b'
                    }}>Expirada</span>
                  ) : null}
                </div>

                {/* Contenido */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 900,
                    background: promo.tipo === 'porcentaje' ? '#f3e8ff' : '#dbeafe',
                    color: promo.tipo === 'porcentaje' ? '#7c3aed' : '#2563eb'
                  }}>
                    {promo.tipo === 'porcentaje' ? `${promo.valor}%` : `$${promo.valor}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--c-espresso)' }}>{promo.nombre}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#888', lineHeight: 1.4 }}>
                      {promo.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Validez */}
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 16, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                  <strong>Validez:</strong>{' '}
                  {promo.esPermanente
                    ? 'Activa permanentemente'
                    : `${new Date(promo.fechaInicio).toLocaleDateString()} — ${new Date(promo.fechaFin).toLocaleDateString()}`
                  }
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleOpenModal(promo)} style={{ flex: 1 }}>
                    ✏️ Editar
                  </button>
                  <button
                    className={`btn btn-sm ${promo.activo ? 'btn-outline' : 'btn-caramel'}`}
                    onClick={() => handleToggleActivo(promo)}
                    style={{ flex: 1 }}
                  >
                    {promo.activo ? '⏸ Desactivar' : '▶ Activar'}
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleDelete(promo._id)}
                    style={{ background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: 700 }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ MODAL ═══════════════ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div className="animate-in" style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
            maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fafafa'
            }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
                {editingPromo ? '✏️ Editar Promoción' : '🎁 Nueva Promoción'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{
                border: 'none', background: '#f3f4f6', borderRadius: 10,
                width: 36, height: 36, fontSize: 18, cursor: 'pointer', fontWeight: 700
              }}>✕</button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              {/* Nombre */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Nombre de la Promoción</label>
                <input className="form-control" type="text" required
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                />
              </div>

              {/* Aplicación + Criterio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Aplicación</label>
                  <select className="form-control" value={formData.aplicacion}
                    onChange={e => setFormData({...formData, aplicacion: e.target.value})}
                  >
                    <option value="manual">✋ Manual (Cajero selecciona)</option>
                    <option value="automatica">⚡ Automática</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Criterio</label>
                  <select className="form-control" value={formData.criterio}
                    onChange={e => setFormData({...formData, criterio: e.target.value})}
                  >
                    <option value="general">Cualquier venta</option>
                    <option value="cliente_frecuente">🏅 Por fidelidad del cliente</option>
                  </select>
                </div>
              </div>

              {/* Rango de compras — solo si criterio es cliente_frecuente */}
              {formData.criterio === 'cliente_frecuente' && (
                <div className="animate-in" style={{
                  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
                  padding: '1rem 1.25rem', marginBottom: 16
                }}>
                  <label style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#92400e', display: 'block', marginBottom: 10 }}>
                    Rango de Compras del Cliente
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11 }}>Mínimo (≥)</label>
                      <input className="form-control" type="number" min="0"
                        value={formData.minimoCompras}
                        onChange={e => setFormData({...formData, minimoCompras: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11 }}>Máximo (≤) — 0 = sin límite</label>
                      <input className="form-control" type="number" min="0"
                        value={formData.maximoCompras}
                        onChange={e => setFormData({...formData, maximoCompras: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: '#78716c', fontStyle: 'italic' }}>
                    Aplica a clientes con entre <strong>{formData.minimoCompras}</strong> y{' '}
                    <strong>{formData.maximoCompras > 0 ? formData.maximoCompras : '∞'}</strong> compras realizadas.
                  </p>
                </div>
              )}

              {/* Tipo y Valor */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Descuento</label>
                  <select className="form-control" value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Monto Fijo ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor</label>
                  <input className="form-control" type="number" required min="0" step="any"
                    value={formData.valor}
                    onChange={e => setFormData({...formData, valor: e.target.value})}
                    placeholder={formData.tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 25.00'}
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-control" rows="2"
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Ej: Descuento especial para clientes VIP."
                />
              </div>

              {/* Vigencia */}
              <div style={{
                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 14,
                padding: '1rem 1.25rem', marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: formData.esPermanente ? 0 : 12 }}>
                  <input type="checkbox" id="perm-chk"
                    checked={formData.esPermanente}
                    onChange={e => setFormData({...formData, esPermanente: e.target.checked})}
                    style={{ width: 18, height: 18, accentColor: 'var(--c-caramel)' }}
                  />
                  <label htmlFor="perm-chk" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Promoción permanente (sin fecha de expiración)
                  </label>
                </div>

                {!formData.esPermanente && (
                  <div className="animate-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11 }}>Fecha Inicio</label>
                      <input className="form-control" type="date" required={!formData.esPermanente}
                        value={formData.fechaInicio}
                        onChange={e => setFormData({...formData, fechaInicio: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: 11 }}>Fecha Fin</label>
                      <input className="form-control" type="date" required={!formData.esPermanente}
                        value={formData.fechaFin}
                        onChange={e => setFormData({...formData, fechaFin: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Activa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="activo-chk"
                  checked={formData.activo}
                  onChange={e => setFormData({...formData, activo: e.target.checked})}
                  style={{ width: 18, height: 18, accentColor: 'var(--c-caramel)' }}
                />
                <label htmlFor="activo-chk" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Promoción activa</label>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-caramel" style={{ flex: 1 }}>
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
