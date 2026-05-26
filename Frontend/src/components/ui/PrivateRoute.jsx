import { Navigate } from 'react-router-dom';

/**
 * STUB — Sprint 4 implementará la verificación de JWT.
 * Por ahora deja pasar siempre (todos los roles tienen acceso).
 *
 * @param {ReactNode} children
 * @param {string[]} roles — roles requeridos (ej. ['admin'])
 */
export default function PrivateRoute({ children, roles = [] }) {
  // TODO Sprint 4: leer token desde localStorage / Context
  // const { user } = useAuth();
  // if (!user) return <Navigate to="/login" replace />;
  // if (roles.length && !roles.includes(user.role)) return <Navigate to="/catalogo" replace />;
  return children;
}
