import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Envoltorio para proteger rutas que requieren Login.
 * Si requiere un rol específico, lo valida.
 */
export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // Si no hay usuario
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si requiere un rol específico y el usuario no lo tiene
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />; // O a una página de "No autorizado"
  }

  return <Outlet />;
}
