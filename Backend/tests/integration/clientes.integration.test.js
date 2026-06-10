/**
 * Fase 4 — Integración Secundaria
 * Suite: Clientes /api/clientes
 * Tests IDs: I-C01 a I-C07
 */

const request = require('supertest');
const app     = require('../../src/index');
const Cliente = require('../../src/models/Cliente');

const crearClienteEnBD = (overrides = {}) =>
  Cliente.create({
    nombre:            overrides.nombre   ?? 'Cliente Default',
    telefono:          overrides.telefono ?? `555-${Date.now()}`,
    comprasRealizadas: overrides.compras  ?? 0,
  });

let adminToken;
let cajeroToken;

beforeEach(async () => {
  adminToken  = await globalThis.createAdminToken();
  cajeroToken = await globalThis.createCajeroToken();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/clientes — Listado y Búsqueda', () => {

  it('[I-C01] Listar todos los clientes → 200', async () => {
    await crearClienteEnBD({ nombre: 'Ana García' });
    await crearClienteEnBD({ nombre: 'Luis Pérez' });

    const res = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('[I-C02] Búsqueda por nombre parcial → filtrado correcto', async () => {
    await crearClienteEnBD({ nombre: 'Juan Hernández' });
    await crearClienteEnBD({ nombre: 'María Mejía' });

    const res = await request(app)
      .get('/api/clientes?busqueda=Juan')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some(c => c.nombre.includes('Juan'))).toBe(true);
    // María no debe aparecer en resultados de búsqueda por "Juan"
    expect(res.body.data.every(c => !c.nombre.includes('María'))).toBe(true);
  });

  it('[I-C02b] Sin token → 401', async () => {
    const res = await request(app).get('/api/clientes');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/clientes — Crear Cliente', () => {

  it('[I-C03] Crear cliente válido → 201 con comprasRealizadas=0', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ nombre: 'Roberto Fuentes', telefono: '555-9999' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nombre).toBe('Roberto Fuentes');
    expect(res.body.data.comprasRealizadas).toBe(0);
  });

  it('[I-C04] Teléfono duplicado → 409 (clave única)', async () => {
    await crearClienteEnBD({ telefono: '555-DUPE' });

    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ nombre: 'Otro Cliente', telefono: '555-DUPE' });

    expect(res.status).toBe(409);
  });

  it('[I-C05] Sin nombre (campo requerido) → 400', async () => {
    const res = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ telefono: '555-0000' }); // sin nombre

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PUT /api/clientes/:id — Actualizar Cliente', () => {

  it('[I-C06] Actualizar nombre de cliente existente → 200', async () => {
    const cliente = await crearClienteEnBD({ nombre: 'Nombre Original' });

    const res = await request(app)
      .put(`/api/clientes/${cliente._id}`)
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ nombre: 'Nombre Actualizado', telefono: cliente.telefono });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Nombre Actualizado');
  });

  it('[I-C07] ID de cliente inexistente → 404', async () => {
    const fakeId = '64a3f8a9c8e4f2b3d1e56789';
    const res = await request(app)
      .put(`/api/clientes/${fakeId}`)
      .set('Authorization', `Bearer ${cajeroToken}`)
      .send({ nombre: 'Nadie', telefono: '000' });

    expect(res.status).toBe(404);
  });
});
