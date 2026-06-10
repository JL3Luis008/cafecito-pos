/**
 * Fase 1 — Unitarios Críticos
 * Pruebas del middleware checkRole (RBAC)
 * Tests IDs: U-R01 a U-R04
 */

const checkRole = require('../../src/middleware/checkRole');

// Helper: crea mocks de req/res/next de Express
const mockExpress = (userOverrides = {}) => {
  // Verificamos si 'user' existe como propiedad en el objeto, incluso si es undefined
  const req = { user: 'user' in userOverrides ? userOverrides.user : { id: 'abc', rol: 'cajero' } };
  const res = {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
};

describe('checkRole — Middleware RBAC', () => {

  describe('[U-R01] Sin req.user (no autenticado)', () => {
    it('devuelve 401 si req.user es undefined', () => {
      const { req, res, next } = mockExpress({ user: undefined });
      checkRole(['admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('[U-R02] Rol correcto — debe pasar', () => {
    it('admin accede a ruta de admin', () => {
      const { req, res, next } = mockExpress({ user: { id: '1', rol: 'admin' } });
      checkRole(['admin'])(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('cajero accede a ruta de cajero', () => {
      const { req, res, next } = mockExpress({ user: { id: '2', rol: 'cajero' } });
      checkRole(['cajero'])(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('admin accede a ruta que admite admin o cajero', () => {
      const { req, res, next } = mockExpress({ user: { id: '1', rol: 'admin' } });
      checkRole(['admin', 'cajero'])(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('[U-R03] Rol incorrecto — debe bloquear', () => {
    it('cajero intenta acceder a ruta exclusiva de admin → 403', () => {
      const { req, res, next } = mockExpress({ user: { id: '2', rol: 'cajero' } });
      checkRole(['admin'])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: expect.stringContaining('Acceso denegado') })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('[U-R04] Array vacío — sin restricción de rol', () => {
    it('cualquier usuario autenticado puede acceder', () => {
      const { req, res, next } = mockExpress({ user: { id: '3', rol: 'cajero' } });
      checkRole([])(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
