/**
 * Fase 2 — Setup de Integración
 * Configura MongoDB en-memoria para todas las suites de integración.
 * Se ejecuta automáticamente gracias a setupFiles en vitest.config.js
 *
 * Requiere: npm install --save-dev mongodb-memory-server mongoose
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// ─── Helpers globales para factories ─────────────────────────────────────────
// Disponibles en cualquier test de integración via globalThis
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

globalThis.createAdminToken = async () => {
  const Usuario = require('../../src/models/Usuario');
  const admin = await Usuario.create({
    nombre:   'Admin Test',
    email:    `admin.${Date.now()}@test.com`,
    password: 'password123',
    rol:      'admin',
    activo:    true,
  });
  return jwt.sign({ id: admin._id, rol: 'admin' }, process.env.JWT_SECRET || 'test-secret-key-qa', { expiresIn: '1h' });
};

globalThis.createCajeroToken = async () => {
  const Usuario = require('../../src/models/Usuario');
  const cajero = await Usuario.create({
    nombre:   'Cajero Test',
    email:    `cajero.${Date.now()}@test.com`,
    password: 'password123',
    rol:      'cajero',
    activo:    true,
  });
  return jwt.sign({ id: cajero._id, rol: 'cajero' }, process.env.JWT_SECRET || 'test-secret-key-qa', { expiresIn: '1h' });
};

// ─── Lifecycle de MongoDB en memoria ─────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'test-secret-key-qa';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Limpiar todas las colecciones entre suites para tests aislados
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
