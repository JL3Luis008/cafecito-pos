const mongoose = require('mongoose');
const Usuario = require('../../src/models/Usuario');
const Cliente = require('../../src/models/Cliente');
const Venta = require('../../src/models/Venta');
const bcrypt = require('bcryptjs');

describe('Unit Tests — Schemas & Hooks', () => {
  
  describe('Usuario Model', () => {
    it('[U-S06] Debe tener rol cajero por defecto', () => {
      const usuario = new Usuario();
      expect(usuario.rol).toBe('cajero');
    });

    it('[U-S11] Debe hashear la contraseña antes de guardar', async () => {
      const password = 'password123';
      const usuario = new Usuario({
        nombre: 'Test',
        email: 'test@test.com',
        password
      });

      // Simular pre-save hook
      await usuario.constructor.schema.s.hooks.execPre('save', usuario);
      
      expect(usuario.password).not.toBe(password);
      const isMatch = await bcrypt.compare(password, usuario.password);
      expect(isMatch).toBe(true);
    });

    it('[U-S07] Password no debe ser seleccionable por defecto', () => {
      const path = Usuario.schema.path('password');
      expect(path.options.select).toBe(false);
    });
  });

  describe('Cliente Model', () => {
    it('[U-S08] Debe tener 0 compras realizadas por defecto', () => {
      const cliente = new Cliente();
      expect(cliente.comprasRealizadas).toBe(0);
    });

    it('[U-S09] Debe validar formato de correo', async () => {
      const cliente = new Cliente({
        nombre: 'Juan',
        telefono: '12345678',
        correo: 'correo-invalido'
      });
      
      let err;
      try {
        await cliente.validate();
      } catch (e) {
        err = e;
      }
      expect(err.errors.correo).toBeDefined();
    });
  });

  describe('Venta Model', () => {
    it('[U-S10] Debe tener estado completada por defecto', () => {
      const venta = new Venta();
      expect(venta.estado).toBe('completada');
    });

    it('[U-S11] Debe validar que el descuentoPorcentaje sea uno de [0, 5, 10, 15]', async () => {
      const venta = new Venta({
        total: 100,
        subtotal: 100,
        descuentoPorcentaje: 20 // No permitido
      });

      let err;
      try {
        await venta.validate();
      } catch (e) {
        err = e;
      }
      expect(err.errors.descuentoPorcentaje).toBeDefined();
    });

    it('[U-S12] Debe generar folio con formato CF-XXXXXX antes de guardar', async () => {
        // Mock countDocuments for the pre-save hook
        const countSpy = vi.spyOn(mongoose.Model, 'countDocuments').mockResolvedValue(42);
        
        const venta = new Venta({
          items: [{ producto: new mongoose.Types.ObjectId(), nombre: 'Test', precio: 10, cantidad: 1, subtotal: 10 }],
          total: 10,
          subtotal: 10
        });

        // Simular pre-save hook
        await venta.constructor.schema.s.hooks.execPre('save', venta);
        
        expect(venta.folio).toBe('CF-000043');
        countSpy.mockRestore();
    });
  });
});
