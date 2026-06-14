import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileModal from './ProfileModal';

const NAV_LINKS = [
  { to: '/catalogo',        label: 'Catálogo',   icon: '🧾', roles: ['admin', 'cajero'] },
  { to: '/caja',            label: 'Caja',       icon: '💰', roles: ['admin', 'cajero'] },
  { to: '/admin/productos', label: 'Productos',  icon: '📦', roles: ['admin'] },
  { to: '/admin/usuarios',  label: 'Usuarios',   icon: '👥', roles: ['admin'] },
  { to: '/admin/promociones', label: 'Promociones', icon: '🎁', roles: ['admin'] },
  { to: '/admin/reportes',  label: 'Reportes',   icon: '📊', roles: ['admin'] },
  { to: '/admin/historial', label: 'Historial',  icon: '📜', roles: ['admin'] },
];


export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarUrl = user?.avatar ? `http://localhost:4000${user.avatar}` : null;

  return (
    <>
      <nav className="navbar" style={{ justifyContent: 'space-between' }} >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NavLink to="/" className="navbar__brand">
          <span className="navbar__brand-icon">☕</span>
          <span style={{ marginRight: '100px' }}>
            Cafecito Feliz
            <span className="navbar__brand-sub">Sistema POS</span>
          </span>
          </NavLink>

          <div className="navbar__nav">
            {NAV_LINKS.filter(link => link.roles.includes(user?.rol)).map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `navbar__link${isActive ? ' active' : ''}`
                }
              >
                <span>{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
            onClick={() => setIsProfileOpen(true)}
            className="navbar__user-pill"
          >
            <div style={{ textAlign: 'right', lineHeight: '1' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--c-primary)' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--c-text-light)', textTransform: 'capitalize' }}>
                {user?.rol}
              </div>
            </div>
            
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--c-bg-light)', 
              overflow: 'hidden',
              border: '2px solid var(--c-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '👤'
              )}
            </div>
          </div>
          
          <button 
            className="btn btn-outline btn-sm" 
            onClick={handleLogout}
            style={{ borderRadius: '20px', padding: '0.4rem 1rem' }}
          >
            Salir
          </button>
        </div>
      </nav>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </>
  );
}
