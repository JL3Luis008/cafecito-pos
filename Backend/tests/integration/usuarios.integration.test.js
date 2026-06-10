/**
 * Fase 4 — Integración Secundaria
 * Suite: Usuarios /api/usuarios (Gestión Administrativa)
 * Tests IDs: I-U01 a I-U07
 */

const request = require('supertest');
const app     = require('../../src/index');
const Usuario = require('../../src/models/Usuario');

let adminToken;
let cajeroToken;

beforeEach(async () => {
  adminToken  = await globalThis.createAdminToken();
  cajeroToken = await globalThis.createCajeroToken();
});

describe('GET /api/usuarios — Listado de Personal', () => {

  it('[I-U01] Admin lista a todos los usuarios → 200', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Debe haber al menos el admin del token + el cajero del token + los creados en setup
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('[I-U02] Cajero no puede listar usuarios → 403', async () => {
    const res = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${cajeroToken}`);

    expect(res.status).toBe(403);
  });
});

describe('POST /api/usuarios — Crear de Usuario', () => {

  it('[I-U03] Admin crea un nuevo cajero válidamente', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Nuevo Empleado',
        email: 'nuevo@cafecito.com',
        password: 'password123',
        rol: 'cajero'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.nombre).toBe('Nuevo Empleado');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('[I-U04] Error al crear usuario con email duplicado → 400', async () => {
    await Usuario.create({ nombre: 'X', email: 'dupe@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Y',
        email: 'dupe@test.com',
        password: 'password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/registrado/i);
  });
});

describe('PUT /api/usuarios/:id — Actualización', () => {

  it('[I-U05] Admin actualiza datos de un usuario', async () => {
    const user = await Usuario.create({ nombre: 'Original', email: 'o@test.com', password: 'password123' });

    const res = await request(app)
      .put(`/api/usuarios/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Actualizado', rol: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Actualizado');
    expect(res.body.data.rol).toBe('admin');
  });
});

describe('DELETE /api/usuarios/:id — Desactivación Lógica', () => {

  it('[I-U06] Admin desactiva a un usuario (borrado lógico)', async () => {
    const user = await Usuario.create({ nombre: 'A Eliminar', email: 'bye@test.com', password: 'password123' });

    const res = await request(app)
      .delete(`/api/usuarios/${user._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const inactivo = await Usuario.findById(user._id);
    expect(inactivo.activo).toBe(false);
  });

  it('[I-U07] No permitir que el admin se auto-elimine → 400', async () => {
    // Necesitamos el ID real del token. Decodificamos el token (aunque el setup lo hace fácil)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(adminToken);

    const res = await request(app)
      .delete(`/api/usuarios/${decoded.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/mismo/i);
  });
});
