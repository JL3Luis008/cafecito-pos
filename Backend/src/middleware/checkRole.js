/**
 * Middleware de control de acceso basado en roles (RBAC).
 * STUB — Sprint 4 activa la validación real.
 *
 * Uso: router.delete('/:id', checkRole(['admin']), handler)
 */
const checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    if (roles.length && !roles.includes(req.user.rol)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: Privilegios insuficientes' });
    }
    next();
  };
};

module.exports = checkRole;
