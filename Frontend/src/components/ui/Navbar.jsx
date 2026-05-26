import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/catalogo',        label: 'Catálogo',   icon: '🧾', roles: ['admin', 'cajero'] },
  { to: '/admin/productos', label: 'Productos',  icon: '📦', roles: ['admin'] },
  { to: '/admin/usuarios',  label: 'Usuarios',   icon: '👥', roles: ['admin'] },
  { to: '/admin/reportes',  label: 'Reportes',   icon: '📊', roles: ['admin'] },
  // Sprint 2: { to: '/ventas',  label: 'Ventas',   icon: '🛒' },
  // Sprint 3: { to: '/clientes', label: 'Clientes', icon: '👤' },
  // Sprint 5: { to: '/reportes', label: 'Reportes', icon: '📊' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--c-text-light)' }}>
        <span className="text-sm">Hola, <b>{user?.nombre?.split(' ')[0] || 'Cajero'}</b></span>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}
