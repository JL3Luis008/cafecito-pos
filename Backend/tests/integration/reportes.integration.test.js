/**
 * Fase 4 — Integración Secundaria
 * Suite: Reportes /api/reportes
 * Tests IDs: I-R01 a I-R05
 */

const request = require('supertest');
const app     = require('../../src/index');
const Venta   = require('../../src/models/Venta');
const Producto = require('../../src/models/Producto');

let adminToken;
let cajeroToken;

beforeEach(async () => {
  adminToken  = await globalThis.createAdminToken();
  cajeroToken = await globalThis.createCajeroToken();
});

describe('GET /api/reportes/dashboard — Estadísticas', () => {

  it('[I-R01] Admin accede al dashboard y recibe estadísticas → 200', async () => {
    // Crear algo de data para que no esté vacío
    const p = await Producto.create({ nombre: 'X', precio: 10, categoria: 'otros', stock: 2 });
    await Venta.create({
      items: [{ producto: p._id, nombre: 'X', precio: 10, cantidad: 1, subtotal: 10 }],
      subtotal: 10,
      total: 10,
      estado: 'completada'
    });

    const res = await request(app)
      .get('/api/reportes/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hoy).toBeDefined();
    expect(res.body.data.stockBajoAlertas).toBeGreaterThanOrEqual(1);
  });

  it('[I-R02] Cajero tiene prohibido el acceso a reportes → 403', async () => {
    const res = await request(app)
      .get('/api/reportes/dashboard')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/reportes/tendencia', () => {
  it('[I-R03] Retorna array de tendencia de ventas', async () => {
    const res = await request(app)
      .get('/api/reportes/tendencia')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/reportes/categorias', () => {
  it('[I-R04] Retorna ventas agrupadas por categoría', async () => {
    const res = await request(app)
      .get('/api/reportes/categorias')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('GET /api/reportes/usuarios', () => {
  it('[I-R05] Retorna desempeño por cajero', async () => {
    const res = await request(app)
      .get('/api/reportes/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
