const request = require('supertest');
const app = require('../../src/index');
const Promocion = require('../../src/models/Promocion');
const mongoose = require('mongoose');

describe('Promociones Integration Tests', () => {
  let adminToken;
  let cajeroToken;

  beforeAll(async () => {
    adminToken = await globalThis.createAdminToken();
    cajeroToken = await globalThis.createCajeroToken();
  });

  afterEach(async () => {
    await Promocion.deleteMany({});
  });

  describe('GET /api/promociones', () => {
    it('[I-PR01] Debe listar todas las promociones (Admin)', async () => {
      await Promocion.create({
        nombre: 'Promo 1',
        valor: 10,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .get('/api/promociones')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('[I-PR02] Debe permitir listar promociones a un Cajero', async () => {
      const res = await request(app)
        .get('/api/promociones')
        .set('Authorization', `Bearer ${cajeroToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/promociones', () => {
    const nuevaPromo = {
      nombre: 'Descuento Verano',
      descripcion: '15% menos en todo',
      tipo: 'porcentaje',
      valor: 15,
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 86400000)
    };

    it('[I-PR03] Admin debe crear una nueva promoción', async () => {
      const res = await request(app)
        .post('/api/promociones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(nuevaPromo);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(nuevaPromo.nombre);
    });

    it('[I-PR04] Cajero NO debe poder crear una promoción (403)', async () => {
      const res = await request(app)
        .post('/api/promociones')
        .set('Authorization', `Bearer ${cajeroToken}`)
        .send(nuevaPromo);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('[I-PR05] Error al crear promoción con datos incompletos (400)', async () => {
      const res = await request(app)
        .post('/api/promociones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Incompleta' });

      expect(res.status).toBe(400); // Mongoose ValidationError -> 400
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/promociones/:id', () => {
    it('[I-PR06] Admin debe actualizar una promoción existente', async () => {
      const promo = await Promocion.create({
        nombre: 'Promo original',
        valor: 5,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .put(`/api/promociones/${promo._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Promo actualizada', valor: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe('Promo actualizada');
      expect(res.body.data.valor).toBe(20);
    });
  });

  describe('DELETE /api/promociones/:id', () => {
    it('[I-PR07] Admin debe eliminar una promoción', async () => {
      const promo = await Promocion.create({
        nombre: 'A borrar',
        valor: 1,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 86400000)
      });

      const res = await request(app)
        .delete(`/api/promociones/${promo._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Promoción eliminada');
      
      const existe = await Promocion.findById(promo._id);
      expect(existe).toBeNull();
    });
  });
});
