/**
 * Fase 3 — Integración Crítica
 * Suite: Ventas /api/ventas — Flujo Completo
 * Tests IDs: I-V01 a I-V17
 *
 * Cubre: registro de venta, descuentos por fidelidad, decremento de stock,
 * incremento de comprasRealizadas, y control de acceso.
 */

const request  = require('supertest');
const app      = require('../../src/index');
const Producto = require('../../src/models/Producto');
const Cliente  = require('../../src/models/Cliente');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const crearProducto = (overrides = {}) =>
  Producto.create({
    nombre:    overrides.nombre    ?? 'Café Americano',
    precio:    overrides.precio    ?? 5.00,
    categoria: overrides.categoria ?? 'bebidas',
    stock:     overrides.stock     ?? 10,
    activo:    overrides.activo    ?? true,
  });

const crearCliente = (compras = 0) =>
  Cliente.create({
    nombre:            `Cliente Test ${Date.now()}`,
    telefono:          `555-${Date.now()}`,
    comprasRealizadas: compras,
  });

// ─── Setup: tokens ────────────────────────────────────────────────────────────
let adminToken;
let cajeroToken;

beforeEach(async () => {
  adminToken  = await globalThis.createAdminToken();
  cajeroToken = await globalThis.createCajeroToken();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/ventas — Registro de Venta', () => {

  it('[I-V01] Venta válida sin cliente → 201 con folio CF-XXXXXX', async () => {
    const prod = await crearProducto();

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.folio).toMatch(/^CF-\d{6}$/);
    expect(res.body.data.total).toBe(10.00); // 5 * 2
    expect(res.body.data.descuentoPorcentaje).toBe(0);
  });

  it('[I-V02] Cliente nuevo (0 compras) → 0% descuento', async () => {
    const prod    = await crearProducto({ precio: 10 });
    const cliente = await crearCliente(0);

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }], clienteId: cliente._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.descuentoPorcentaje).toBe(0);
    expect(res.body.data.subtotal).toBe(10.00);
    expect(res.body.data.total).toBe(10.00);
  });

  it('[I-V03] Cliente Trial (1-3 compras) → 5% descuento', async () => {
    const prod    = await crearProducto({ precio: 100 });
    const cliente = await crearCliente(2); // compra #3 → sigue en Trial

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }], clienteId: cliente._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.descuentoPorcentaje).toBe(5);
    expect(res.body.data.descuentoMonto).toBe(5.00);
    expect(res.body.data.total).toBe(95.00);
  });

  it('[I-V04] Cliente Weekly (4-7 compras) → 10% descuento', async () => {
    const prod    = await crearProducto({ precio: 100 });
    const cliente = await crearCliente(5);

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }], clienteId: cliente._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.descuentoPorcentaje).toBe(10);
    expect(res.body.data.total).toBe(90.00);
  });

  it('[I-V05] Cliente VIP (8+ compras) → 15% descuento', async () => {
    const prod    = await crearProducto({ precio: 100 });
    const cliente = await crearCliente(10);

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }], clienteId: cliente._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.data.descuentoPorcentaje).toBe(15);
    expect(res.body.data.total).toBe(85.00);
  });

  it('[I-V06] El stock se decrementa correctamente tras la venta', async () => {
    const prod = await crearProducto({ stock: 10 });

    await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 3 }] });

    const prodActualizado = await Producto.findById(prod._id);
    expect(prodActualizado.stock).toBe(7); // 10 - 3
  });

  it('[I-V07] comprasRealizadas del cliente se incrementa en +1', async () => {
    const prod    = await crearProducto();
    const cliente = await crearCliente(2);

    await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }], clienteId: cliente._id.toString() });

    const clienteActualizado = await Cliente.findById(cliente._id);
    expect(clienteActualizado.comprasRealizadas).toBe(3);
  });

  it('[I-V08] Producto inexistente → 400', async () => {
    const fakeId = '64a3f8a9c8e4f2b3d1e56789';
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: fakeId, cantidad: 1 }] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('[I-V09] Stock insuficiente → 400', async () => {
    const prod = await crearProducto({ stock: 2 });

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 5 }] });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/stock insuficiente/i);
  });

  it('[I-V10] Producto inactivo → 400 (no aparece en búsqueda)', async () => {
    const prod = await crearProducto({ activo: false });

    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }] });

    expect(res.status).toBe(400);
  });

  it('[I-V11] Array de items vacío → 400 (validación)', async () => {
    const res = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [] });

    expect(res.status).toBe(400);
  });

  it('[I-V12] Sin token de autenticación → 401', async () => {
    const prod = await crearProducto();
    const res  = await request(app)
      .post('/api/ventas')
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }] });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/ventas/:id — Obtener Venta', () => {

  it('[I-V13] ID válido de venta existente → 200 con datos', async () => {
    const prod = await crearProducto();
    const ventaRes = await request(app)
      .post('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ items: [{ productoId: prod._id.toString(), cantidad: 1 }] });

    const ventaId = ventaRes.body.data._id;

    const res = await request(app)
      .get(`/api/ventas/${ventaId}`)
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(ventaId);
    expect(res.body.data.folio).toMatch(/^CF-/);
  });

  it('[I-V14] ID de venta inexistente → 404', async () => {
    const fakeId = '64a3f8a9c8e4f2b3d1e56789';
    const res = await request(app)
      .get(`/api/ventas/${fakeId}`)
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(404);
  });

  it('[I-V15] ID con formato inválido → 400', async () => {
    const res = await request(app)
      .get('/api/ventas/NOESUNAOID')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/ventas — Listado (solo admin)', () => {

  it('[I-V16] Admin puede listar ventas → 200', async () => {
    const res = await request(app)
      .get('/api/ventas')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('[I-V17] Cajero intenta listar ventas → 403', async () => {
    const res = await request(app)
      .get('/api/ventas')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(403);
  });
});
