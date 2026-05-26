/**
 * Sprint 0 — Smoke tests
 * Verifica que los módulos cargan y los schemas tienen la forma esperada.
 * globals: true en vitest.config.js → describe/it/expect disponibles sin import.
 */
describe('Producto — Schema y Validaciones', () => {
  it('el módulo Producto exporta un modelo Mongoose', () => {
    const Producto = require('../../src/models/Producto');
    expect(Producto).toBeDefined();
    expect(Producto.modelName).toBe('Producto');
  });

  it('las categorías válidas son exactamente 4', () => {
    const Producto = require('../../src/models/Producto');
    const categorias = Producto.schema.path('categoria').enumValues;
    expect(categorias).toHaveLength(4);
    expect(categorias).toContain('bebidas');
    expect(categorias).toContain('alimentos');
    expect(categorias).toContain('postres');
    expect(categorias).toContain('otros');
  });

  it('el campo precio no acepta valores negativos', () => {
    const Producto = require('../../src/models/Producto');
    const precioPath = Producto.schema.path('precio');
    expect(precioPath.options.min[0]).toBe(0.01);
  });

  it('activo tiene valor por defecto true', () => {
    const Producto = require('../../src/models/Producto');
    const activoPath = Producto.schema.path('activo');
    expect(activoPath.defaultValue).toBe(true);
  });
});

describe('Usuario — Schema RBAC', () => {
  it('los roles válidos son admin y cajero', () => {
    const Usuario = require('../../src/models/Usuario');
    const roles = Usuario.schema.path('rol').enumValues;
    expect(roles).toEqual(['admin', 'cajero']);
  });

  it('el rol por defecto es cajero', () => {
    const Usuario = require('../../src/models/Usuario');
    const roleDefault = Usuario.schema.path('rol').defaultValue;
    expect(roleDefault).toBe('cajero');
  });

  it('password está excluida de los queries por defecto (select: false)', () => {
    const Usuario = require('../../src/models/Usuario');
    const passPath = Usuario.schema.path('password');
    expect(passPath.options.select).toBe(false);
  });
});
