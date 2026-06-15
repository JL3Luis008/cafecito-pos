const Usuario = require('./src/models/Usuario');
const Producto = require('./src/models/Producto');
const Cliente = require('./src/models/Cliente');
const Promocion = require('./src/models/Promocion');

const seedData = async () => {
  console.log('\n🌱 Ejecutando seed de datos...\n');

  // ─── USUARIOS ───────────────────────────────────────────────────────
  console.log('👥 Sembrando usuarios...');
  const usuariosData = [
    { nombre: 'Administrador Maestro', email: 'admin@cafecito.com', password: 'admin123', rol: 'admin', activo: true },
    { nombre: 'Cajero01(Luis)', email: 'cajero01@cafecito.com', password: 'cajero123', rol: 'cajero', activo: true },
    { nombre: 'cajero02', email: 'cajero02@cafecito.com', password: 'cajero123', rol: 'cajero', activo: true },
    { nombre: 'Test User', email: 'testuser@cafecito.com', password: 'test123', rol: 'cajero', activo: true },
  ];
  for (const u of usuariosData) {
    const exists = await Usuario.findOne({ email: u.email });
    if (!exists) {
      await Usuario.create(u);
      console.log(`  ✅ ${u.email} (${u.rol})`);
    } else {
      console.log(`  ⏭️ ${u.email} ya existe`);
    }
  }

  // ─── PRODUCTOS ──────────────────────────────────────────────────────
  console.log('\n📦 Sembrando productos...');
  const productosData = [
    { nombre: 'Cafe Americano',   precio: 35, categoria: 'bebidas',    stock: 3,  activo: true },
    { nombre: 'moffin',           precio: 20, categoria: 'postres',    stock: 12, activo: true },
    { nombre: 'galleta New york', precio: 25, categoria: 'postres',    stock: 5,  activo: true },
    { nombre: 'capuchino',        precio: 30, categoria: 'bebidas',    stock: 73, activo: true },
    { nombre: 'sandwich club',    precio: 50, categoria: 'alimentos',  stock: 17, activo: true },
    { nombre: 'doble expreso',    precio: 80, categoria: 'bebidas',    stock: 46, activo: true },
    { nombre: 'leche deslactosada (porción)', precio: 5, categoria: 'bebidas', stock: 13, activo: true },
    { nombre: 'Leche de almendras', precio: 10, categoria: 'bebidas', stock: 14, activo: true },
  ];
  for (const p of productosData) {
    const exists = await Producto.findOne({ nombre: p.nombre });
    if (!exists) {
      await Producto.create(p);
      console.log(`  ✅ ${p.nombre}`);
    } else {
      console.log(`  ⏭️ ${p.nombre} ya existe`);
    }
  }

  // ─── CLIENTES ───────────────────────────────────────────────────────
  console.log('\n👤 Sembrando clientes...');
  const clientesData = [
    { nombre: 'Juan Perez',         telefono: '5551234567', correo: null,                     comprasRealizadas: 1 },
    { nombre: 'Rocio almada',       telefono: '44915965',  correo: 'roci23o@giaml.com',       comprasRealizadas: 6 },
    { nombre: 'Adriana Villalpando', telefono: '4491596435', correo: 'adris144@gmail.com',     comprasRealizadas: 3 },
  ];
  for (const c of clientesData) {
    const exists = await Cliente.findOne({ telefono: c.telefono });
    if (!exists) {
      await Cliente.create(c);
      console.log(`  ✅ ${c.nombre}`);
    } else {
      console.log(`  ⏭️ ${c.nombre} ya existe`);
    }
  }

  // ─── PROMOCIONES ────────────────────────────────────────────────────
  console.log('\n🎁 Sembrando promociones...');
  const promocionesData = [
    {
      nombre: 'cliente frecuente (5%)',
      descripcion: '5% descuento por compras frecuentes 1-3',
      tipo: 'porcentaje', valor: 5, esPermanente: true,
      fechaInicio: new Date('2026-01-01'), fechaFin: new Date('2028-01-01'),
      activo: true, aplicacion: 'automatica', criterio: 'cliente_frecuente',
      minimoCompras: 1, maximoCompras: 3,
    },
    {
      nombre: 'Sabado Godin',
      descripcion: 'promocion de Sabado',
      tipo: 'porcentaje', valor: 10, esPermanente: true,
      fechaInicio: new Date('2026-06-01'), fechaFin: new Date('2027-01-01'),
      activo: false, aplicacion: 'manual', criterio: 'general',
      minimoCompras: 0, maximoCompras: 0,
    },
    {
      nombre: 'cliente frecuente (10%)',
      descripcion: '10% descuento por compras frecuentes (4 -7 compras)',
      tipo: 'porcentaje', valor: 10, esPermanente: true,
      fechaInicio: new Date('2026-01-01'), fechaFin: new Date('2028-01-01'),
      activo: true, aplicacion: 'automatica', criterio: 'cliente_frecuente',
      minimoCompras: 4, maximoCompras: 7,
    },
    {
      nombre: 'cliente frecuente (15%)',
      descripcion: 'cliente frecuente (15%)',
      tipo: 'porcentaje', valor: 15, esPermanente: true,
      fechaInicio: null, fechaFin: null,
      activo: true, aplicacion: 'automatica', criterio: 'cliente_frecuente',
      minimoCompras: 8, maximoCompras: 0,
    },
  ];
  for (const promo of promocionesData) {
    const exists = await Promocion.findOne({ nombre: promo.nombre });
    if (!exists) {
      await Promocion.create(promo);
      console.log(`  ✅ ${promo.nombre}`);
    } else {
      console.log(`  ⏭️ ${promo.nombre} ya existe`);
    }
  }

  console.log('\n🎉 Seed completado exitosamente.');
};

module.exports = seedData;

// ─── Ejecución directa ───────────────────────────────────────────────────
if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  (async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafecito-pos';
      await mongoose.connect(mongoUri);
      console.log('📦 Conectado a MongoDB...');
      await seedData();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error al sembrar datos:', error);
      process.exit(1);
    }
  })();
}
