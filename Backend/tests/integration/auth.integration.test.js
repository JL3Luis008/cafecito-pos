/**
 * Fase 3 — Integración Crítica
 * Suite: Autenticación /api/auth
 * Tests IDs: I-A01 a I-A08
 */

const request = require('supertest');
const app     = require('../../src/index');
const Usuario = require('../../src/models/Usuario');

// ─── Setup: crear usuario de prueba antes de los tests ───────────────────────
let usuarioActivo;
let usuarioInactivo;

beforeEach(async () => {
  usuarioActivo = await Usuario.create({
    nombre:   'María Activa',
    email:    'maria@cafecito.com',
    password: 'miPassword123',
    rol:      'cajero',
    activo:    true,
  });

  usuarioInactivo = await Usuario.create({
    nombre:   'Pedro Suspendido',
    email:    'pedro@cafecito.com',
    password: 'otroPassword456',
    rol:      'cajero',
    activo:    false,
  });
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {

  it('[I-A01] Credenciales válidas → 200 con token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@cafecito.com', password: 'miPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.email).toBe('maria@cafecito.com');
    // No debe exponer la password
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('[I-A02] Email no registrado → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantasma@cafecito.com', password: 'cualquiera' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('[I-A03] Password incorrecta → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@cafecito.com', password: 'passwordMal' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('[I-A04] Usuario inactivo intenta login → 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'pedro@cafecito.com', password: 'otroPassword456' });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/suspendida/i);
  });

  it('[I-A05] Email con formato inválido → 400 (validación)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-es-un-email', password: '123456' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('[I-A05b] Password vacía → 400 (validación)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@cafecito.com', password: '' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  let validToken;

  beforeEach(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'maria@cafecito.com', password: 'miPassword123' });
    validToken = loginRes.body.data?.token;
  });

  it('[I-A06] Token válido → 200 con perfil de usuario', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('maria@cafecito.com');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('[I-A07] Sin token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('[I-A08] Token inválido/manipulado → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token.manipulado.invalido');

    expect(res.status).toBe(401);
  });
});
