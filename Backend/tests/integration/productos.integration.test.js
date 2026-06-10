/**
 * Fase 4 — Integración Secundaria
 * Suite: Productos /api/productos
 * Tests IDs: I-P01 a I-P12
 */

const request  = require('supertest');
const app      = require('../../src/index');
const Producto = require('../../src/models/Producto');

const crearProductoEnBD = (overrides = {}) =>
  Producto.create({
    nombre:    overrides.nombre    ?? 'Latte Vainilla',
    precio:    overrides.precio    ?? 4.50,
    categoria: overrides.categoria ?? 'bebidas',
    stock:     overrides.stock     ?? 20,
    activo:    overrides.activo    ?? true,
  });

let adminToken;
let cajeroToken;

beforeEach(async () => {
  adminToken  = await globalThis.createAdminToken();
  cajeroToken = await globalThis.createCajeroToken();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/productos — Listado', () => {

  it('[I-P01] Listar productos activos por defecto', async () => {
    await crearProductoEnBD({ activo: true });
    await crearProductoEnBD({ nombre: 'Inactivo', activo: false });

    const res = await request(app)
      .get('/api/productos')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Solo deben aparecer los activos
    expect(res.body.data.every(p => p.activo === true)).toBe(true);
  });

  it('[I-P02] ?activo=all incluye productos inactivos', async () => {
    await crearProductoEnBD({ activo: true });
    await crearProductoEnBD({ nombre: 'Inactivo', activo: false });

    const res = await request(app)
      .get('/api/productos?activo=all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('[I-P03] ?categoria=bebidas filtra por categoría', async () => {
    await crearProductoEnBD({ categoria: 'bebidas' });
    await crearProductoEnBD({ nombre: 'Croissant', categoria: 'alimentos' });

    const res = await request(app)
      .get('/api/productos?categoria=bebidas')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(p => p.categoria === 'bebidas')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/productos — Crear', () => {

  it('[I-P04] Admin crea producto válido → 201', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Capuccino', precio: 4.80, categoria: 'bebidas', stock: 50 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe('Capuccino');
  });

  it('[I-P05] Cajero intenta crear producto → 403 Acceso denegado', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ nombre: 'Té Verde', precio: 3.50, categoria: 'bebidas', stock: 30 });

    expect(res.status).toBe(403);
  });

  it('[I-P06] Precio negativo o cero → 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Gratis', precio: -1, categoria: 'bebidas', stock: 10 });

    expect(res.status).toBe(400);
  });

  it('[I-P07] Categoría fuera del enum → 400', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Sushi', precio: 10, categoria: 'invalida', stock: 5 });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/productos/:id — Editar', () => {

  it('[I-P08] Admin edita un producto existente → 200', async () => {
    const prod = await crearProductoEnBD();

    const res = await request(app)
      .put(`/api/productos/${prod._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Latte Editado', precio: 5.50, categoria: 'bebidas', stock: 15 });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Latte Editado');
  });

  it('[I-P09] ID de producto no existente → 404', async () => {
    const fakeId = '64a3f8a9c8e4f2b3d1e56789';
    const res = await request(app)
      .put(`/api/productos/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X', precio: 1, categoria: 'otros', stock: 1 });

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/productos/:id/toggle — Activar/Desactivar', () => {

  it('[I-P10] Toggle de activo→inactivo y viceversa', async () => {
    const prod = await crearProductoEnBD({ activo: true });

    // Primer toggle → inactivo
    const res1 = await request(app)
      .patch(`/api/productos/${prod._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res1.status).toBe(200);
    expect(res1.body.data.activo).toBe(false);

    // Segundo toggle → activo de nuevo
    const res2 = await request(app)
      .patch(`/api/productos/${prod._id}/toggle`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res2.body.data.activo).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/productos/:id — Eliminar', () => {

  it('[I-P11] Admin elimina producto → 200', async () => {
    const prod = await crearProductoEnBD();

    const res = await request(app)
      .delete(`/api/productos/${prod._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('[I-P12] Cajero intenta eliminar → 403', async () => {
    const prod = await crearProductoEnBD();

    const res = await request(app)
      .delete(`/api/productos/${prod._id}`)
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(403);
  });
});
