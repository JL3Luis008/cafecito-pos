/**
 * Fase 1 — Unitarios Críticos
 * Pruebas del errorHandler global de Express
 * Tests IDs: U-E01 a U-E07
 */

const errorHandler = require('../../src/middleware/errorHandler');

// Helper: crea un res mock con encadenamiento
const mockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json:   vi.fn().mockReturnThis(),
  };
  return res;
};

describe('errorHandler — Middleware Global de Errores', () => {

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  describe('[U-E01] Mongoose ValidationError → 400', () => {
    it('responde con 400 y los detalles del error de validación', () => {
      const err = {
        name: 'ValidationError',
        errors: {
          nombre: { message: 'El nombre es obligatorio' },
          precio: { message: 'El precio debe ser mayor a 0' },
        },
      };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Error de validación',
          details: expect.arrayContaining(['El nombre es obligatorio']),
        })
      );
    });
  });

  describe('[U-E02] Mongoose CastError → 400', () => {
    it('responde con 400 cuando el ID no es un ObjectId válido', () => {
      const err = { name: 'CastError', message: 'Cast to ObjectId failed' };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'ID no válido' })
      );
    });
  });

  describe('[U-E03] Mongoose Duplicate Key (11000) → 409', () => {
    it('responde con 409 indicando el campo duplicado', () => {
      const err = { code: 11000, keyValue: { telefono: '555-1234' } };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('telefono'),
        })
      );
    });
  });

  describe('[U-E04] Multer LIMIT_FILE_SIZE → 400', () => {
    it('responde con 400 cuando la imagen es demasiado grande', () => {
      const err = { code: 'LIMIT_FILE_SIZE' };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('5 MB') })
      );
    });
  });

  describe('[U-E05] JsonWebTokenError → 401', () => {
    it('responde con 401 cuando el token JWT es inválido', () => {
      const err = { name: 'JsonWebTokenError', message: 'invalid signature' };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Token inválido' })
      );
    });
  });

  describe('[U-E06] TokenExpiredError → 401', () => {
    it('responde con 401 cuando el token JWT está expirado', () => {
      const err = { name: 'TokenExpiredError', message: 'jwt expired' };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Token expirado' })
      );
    });
  });

  describe('[U-E07] Error genérico → 500', () => {
    it('responde con 500 para errores no tipificados', () => {
      const err = new Error('Algo salió mal inesperadamente');
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('responde con el status personalizado si el error lo tiene', () => {
      const err = { status: 422, message: 'Entidad no procesable' };
      const res = mockRes();
      errorHandler(err, {}, res, () => {});

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });
});
