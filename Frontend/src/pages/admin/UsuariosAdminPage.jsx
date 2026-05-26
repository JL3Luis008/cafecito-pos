import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

export default function UsuariosAdminPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'cajero',
    activo: true
  });

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/usuarios');
      setUsuarios(res.data.data);
    } catch (error) {
      Swal.fire('Error', 'No se pudieron cargar los usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '', // No mostrar password
        rol: user.rol,
        activo: user.activo
      });
    } else {
      setEditUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'cajero',
        activo: true
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        // Si no hay password en el form, no lo enviamos para no sobreescribir con vacío
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        
        await api.put(`/usuarios/${editUser._id}`, payload);
        Swal.fire('Actualizado', 'Usuario actualizado correctamente', 'success');
      } else {
        if (!formData.password) {
          return Swal.fire('Error', 'La contraseña es obligatoria para nuevos usuarios', 'error');
        }
        await api.post('/usuarios', formData);
        Swal.fire('Creado', 'Usuario creado correctamente', 'success');
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.error || 'Error al procesar usuario', 'error');
    }
  };

  const handleToggleEstado = async (user) => {
    const action = user.activo ? 'desactivar' : 'activar';
    const result = await Swal.fire({
      title: `¿Confirmas ${action} a ${user.nombre}?`,
      text: user.activo ? "El usuario no podrá iniciar sesión" : "Se restaurará el acceso",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      confirmButtonColor: user.activo ? 'var(--c-danger)' : 'var(--c-success)'
    });

    if (result.isConfirmed) {
      try {
        await api.put(`/usuarios/${user._id}`, { activo: !user.activo });
        fetchUsuarios();
        Swal.fire('Listo', `Usuario ${action}ado`, 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
      }
    }
  };

  return (
    <div style={{ padding: '100px' }} className="animate-in">
      <header className="page-header">
        <div className="page-title">
          <h1>Gestión de Usuarios</h1>
          <p className="text-muted">Administra el acceso del personal (Admin / Cajeros)</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <UserPlus size={18} />
          Nuevo Usuario
        </button>
      </header>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-4">Cargando personal...</td>
              </tr>
            ) : usuarios.map(user => (
              <tr key={user._id} className={!user.activo ? 'inactive' : ''}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="stat-card__icon" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                      {user.nombre[0].toUpperCase()}
                    </div>
                    <span className="font-bold">{user.nombre}</span>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-small"><Mail size={12} /> {user.email}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.rol === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                    <Shield size={12} />
                    {user.rol}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.activo ? 'badge-success' : 'badge-danger'}`}>
                    {user.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {user.activo ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="btn btn-icon btn-outline" 
                      title="Editar"
                      onClick={() => handleOpenModal(user)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className={`btn btn-icon ${user.activo ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      style={{ 
                        borderColor: user.activo ? 'var(--c-danger)' : 'var(--c-success)',
                        color: user.activo ? 'var(--c-danger)' : 'var(--c-success)'
                      }}
                      title={user.activo ? "Suspender" : "Activar"}
                      onClick={() => handleToggleEstado(user)}
                    >
                      {user.activo ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">{editUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input 
                      className="form-control"
                      required
                      value={formData.nombre}
                      onChange={e => setFormData({...formData, nombre: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo Electrónico</label>
                    <input 
                      type="email"
                      className="form-control"
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Contraseña {editUser && <span className="text-small text-muted">(Dejar en blanco para no cambiar)</span>}
                  </label>
                  <input 
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select 
                      className="form-control"
                      value={formData.rol}
                      onChange={e => setFormData({...formData, rol: e.target.value})}
                    >
                      <option value="cajero">Cajero</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado Inicial</label>
                    <select 
                      className="form-control"
                      value={formData.activo}
                      onChange={e => setFormData({...formData, activo: e.target.value === 'true'})}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Suspendido</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
