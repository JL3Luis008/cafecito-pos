import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, updatePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef();

  // Estados Formulario
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preview, setPreview] = useState(user?.avatar ? `http://localhost:4000${user.avatar}` : null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (fileInputRef.current.files[0]) {
        formData.append('avatar', fileInputRef.current.files[0]);
      }
      await updateProfile(formData);
      setSuccess('¡Perfil actualizado!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden');
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updatePassword({ currentPassword, newPassword });
      setSuccess('¡Contraseña cambiada!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error en la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-card" onClick={e => e.stopPropagation()}>
        <div className="profile-card__header">
          <div className="profile-card__title">
            <span className="icon">👤</span> Configuración de Cuenta
          </div>
          <button className="profile-card__close" onClick={onClose}>&times;</button>
        </div>

        <div className="profile-card__content">
          {error && <div className="profile-alert profile-alert--error">{error}</div>}
          {success && <div className="profile-alert profile-alert--success">{success}</div>}

          <div className="profile-grid">
            {/* Columna Izquierda: Foto y Nombre */}
            <form onSubmit={handleSaveProfile} className="profile-section">
              <h4 className="section-title">Información Personal</h4>
              
              <div className="avatar-upload">
                <div 
                  className="avatar-preview"
                  onClick={() => fileInputRef.current.click()}
                >
                  {preview ? (
                    <img src={preview} alt="Avatar" />
                  ) : (
                    <span className="placeholder">📸</span>
                  )}
                  <div className="avatar-overlay">Cambiar Foto</div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  hidden 
                  accept="image/*"
                />
              </div>

              <div className="profile-input-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>

              <button className="profile-btn profile-btn--primary" disabled={loading}>
                {loading ? 'Procesando...' : 'Guardar Cambios'}
              </button>
            </form>

            <div className="divider"></div>

            {/* Columna Derecha: Seguridad */}
            <form onSubmit={handleSavePassword} className="profile-section">
              <h4 className="section-title">Seguridad</h4>
              
              <div className="profile-input-group">
                <label>Contraseña Actual</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required
                />
              </div>

              <div className="profile-input-group">
                <label>Nueva Contraseña</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required
                  minLength={6}
                />
              </div>

              <div className="profile-input-group">
                <label>Confirmar Nueva</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required
                />
              </div>

              <button className="profile-btn profile-btn--outline" disabled={loading}>
                {loading ? 'Procesando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>
        </div>

        <div className="profile-card__footer">
          <div className="user-info">
            Usuario: <span className="badge">{user?.email}</span> 
            Rol: <span className="badge badge--primary">{user?.rol}</span>
          </div>
          <button className="profile-btn profile-btn--cancel" onClick={onClose}>
            Cerrar Ventana
          </button>
        </div>
      </div>

      <style jsx="true">{`
        .profile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        .profile-card {
          background: #ffffff;
          width: 95%;
          max-width: 800px;
          border-radius: 28px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .profile-card__header {
          padding: 24px 32px;
          background: #1a1a1a;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .profile-card__title {
          font-size: 1.3rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: -0.02em;
        }

        .profile-card__close {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .profile-card__close:hover {
          background: #ef4444;
          border-color: #ef4444;
          transform: rotate(90deg);
        }

        .profile-card__content {
          padding: 32px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1px 1fr;
          gap: 40px;
        }

        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr; gap: 32px; }
          .divider { display: none; }
        }

        .divider { background: #f3f4f6; }

        .section-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title::after {
          content: "";
          height: 2px;
          flex: 1;
          background: #f3f4f6;
        }

        .profile-input-group { margin-bottom: 20px; }

        .profile-input-group label {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .profile-input-group input {
          width: 100%;
          padding: 14px 18px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #f9fafb;
          color: #111827;
        }

        .profile-input-group input:focus {
          border-color: var(--c-primary);
          background: #ffffff;
          outline: none;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }

        .profile-btn {
          width: 100%;
          padding: 16px;
          border-radius: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .profile-btn--primary {
          background: #4f46e5;
          color: white;
          box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
        }

        .profile-btn--primary:hover {
          background: #4338ca;
          transform: translateY(-2px);
          box-shadow: 0 15px 25px -5px rgba(79, 70, 229, 0.5);
        }

        .profile-btn--outline {
          background: #ffffff;
          border: 2px solid #111827;
          color: #111827;
        }

        .profile-btn--outline:hover {
          background: #111827;
          color: #ffffff;
        }

        .profile-btn--cancel {
          width: auto;
          padding: 10px 24px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
          font-size: 0.75rem;
        }

        .profile-btn--cancel:hover {
          background: #e5e7eb;
          color: #000000;
        }

        .profile-alert {
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 28px;
          font-size: 0.95rem;
          font-weight: 700;
          text-align: center;
          border-left: 5px solid;
        }

        .profile-alert--error { 
          background: #fef2f2; 
          color: #991b1b; 
          border-color: #ef4444; 
        }
        .profile-alert--success { 
          background: #f0fdf4; 
          color: #166534; 
          border-color: #22c55e;
        }

        .profile-card__footer {
          padding: 24px 32px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-info {
          font-size: 0.85rem;
          color: #6b7280;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .badge {
          padding: 6px 12px;
          background: #e5e7eb;
          border-radius: 8px;
          font-weight: 800;
          color: #1f2937;
          font-size: 0.75rem;
        }

        .badge--primary {
          background: #dbeafe;
          color: #1e40af;
        }

        /* Avatar styles preserved and enhanced */
        .avatar-upload { display: flex; justify-content: center; margin-bottom: 32px; }
        .avatar-preview {
          width: 130px;
          height: 130px;
          border-radius: 40px;
          background: #f3f4f6;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          border: 3px solid #ffffff;
          box-shadow: 0 15px 30px rgba(0,0,0,0.1);
          transform: rotate(-3deg);
          transition: all 0.3s;
        }
        .avatar-preview:hover { transform: rotate(0) scale(1.05); }
        .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: 0.3s;
          font-weight: 700;
          font-size: 0.8rem;
        }
        .avatar-preview:hover .avatar-overlay { opacity: 1; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(40px) scale(0.92); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}</style>
    </div>
  );
}
