const request = require('supertest');
const app = require('../../src/index');
const CorteCaja = require('../../src/models/CorteCaja');
const Venta = require('../../src/models/Venta');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

describe('Caja Integration Tests', () => {
  let token;

  beforeAll(async () => {
    token = await globalThis.createCajeroToken();
  });

  afterEach(async () => {
    await CorteCaja.deleteMany({});
    await Venta.deleteMany({});
  });

  describe('GET /api/caja/estado', () => {
    it('[I-CJ01] Debe retornar isCajaAbierta: false si no hay turno', async () => {
      const res = await request(app)
        .get('/api/caja/estado')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isCajaAbierta).toBe(false);
    });
  });

  describe('POST /api/caja/abrir', () => {
    it('[I-CJ02] Debe abrir la caja con un monto inicial', async () => {
      const res = await request(app)
        .post('/api/caja/abrir')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoApertura: 500 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.montoApertura).toBe(500);
      expect(res.body.data.estado).toBe('abierto');
    });

    it('[I-CJ03] No debe permitir abrir caja si ya hay un turno activo', async () => {
      // 1. Abrir primero
      await request(app)
        .post('/api/caja/abrir')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoApertura: 500 });

      // 2. Intentar abrir de nuevo
      const res = await request(app)
        .post('/api/caja/abrir')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoApertura: 1000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Ya tienes un turno de caja abierto');
    });
  });

  describe('POST /api/caja/cortar', () => {
    it('[I-CJ04] Debe realizar el corte de caja con ventas calculadas', async () => {
      // 1. Abrir caja
      await request(app)
        .post('/api/caja/abrir')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoApertura: 500 });

      // 2. Crear algunas ventas simuladas para este cajero
      const decoded = jwt.decode(token);
      const cajeroId = decoded.id;
      
      await Venta.create({
          items: [{ producto: new mongoose.Types.ObjectId(), nombre: 'Café', precio: 50, cantidad: 1, subtotal: 50 }],
          total: 50,
          subtotal: 50,
          metodoPago: 'efectivo',
          cajero: cajeroId,
          estado: 'completada'
      });

      await Venta.create({
          items: [{ producto: new mongoose.Types.ObjectId(), nombre: 'Pan', precio: 30, cantidad: 1, subtotal: 30 }],
          total: 30,
          subtotal: 30,
          metodoPago: 'tarjeta',
          cajero: cajeroId,
          estado: 'completada'
      });

      // 3. Realizar el corte
      // Monto esperado en efectivo = 500 (apertura) + 50 (venta) = 550
      const res = await request(app)
        .post('/api/caja/cortar')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          montoCierreReal: 550, 
          notas: 'Todo correcto' 
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('cerrado');
      expect(res.body.data.ventasSistema.efectivo).toBe(50);
      expect(res.body.data.ventasSistema.tarjeta).toBe(30);
      expect(res.body.data.ventasSistema.total).toBe(80);
      expect(res.body.data.diferencia).toBe(0);
    });

    it('[I-CJ05] Debe detectar diferencias (faltantes/sobrantes)', async () => {
      // 1. Abrir nueva caja
      await request(app)
        .post('/api/caja/abrir')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoApertura: 200 });

      // 2. Cortar con monto incorrecto (debería haber 200, reportamos 180)
      const res = await request(app)
        .post('/api/caja/cortar')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoCierreReal: 180 });

      expect(res.status).toBe(200);
      expect(res.body.data.diferencia).toBe(-20);
    });

    it('[I-CJ06] Error al intentar cerrar caja sin turno abierto', async () => {
      const res = await request(app)
        .post('/api/caja/cortar')
        .set('Authorization', `Bearer ${token}`)
        .send({ montoCierreReal: 100 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
