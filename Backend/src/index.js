require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const runSeed = require('../seed');
const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes    = require('./routes/ventaRoutes');
const clienteRoutes  = require('./routes/clienteRoutes');
const authRoutes     = require('./routes/authRoutes');
const reporteRoutes  = require('./routes/reporteRoutes');
const usuarioRoutes  = require('./routes/usuarioRoutes');
const cajaRoutes     = require('./routes/cajaRoutes');
const promocionRoutes = require('./routes/promocionRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Base de Datos ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    if (process.env.RUN_SEED === 'true') {
      runSeed();
    }
  });
}

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Archivos estáticos (imágenes de productos) ──────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas peticiones, intenta en unos minutos' },
  })
);

// ─── Rutas API ────────────────────────────────────────────────────────────────
app.use('/api/productos', productoRoutes);
app.use('/api/ventas',    ventaRoutes);
app.use('/api/clientes',  clienteRoutes);
app.use('/api/auth',      authRoutes);
app.use('/api/reportes',  reporteRoutes);
app.use('/api/usuarios',  usuarioRoutes);
app.use('/api/caja',      cajaRoutes);
app.use('/api/promociones', promocionRoutes);

// Rutas futuras (se activarán en sprints posteriores)
// app.use('/api/reportes', reporteRoutes);  // Sprint 5

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Error Handler Global (siempre al final) ──────────────────────────────────
app.use(errorHandler);

// ─── Servidor ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('\n☕ ─────────────────────────────────────');
    console.log(`   Cafecito POS — Backend`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Entorno: ${process.env.NODE_ENV}`);
    console.log('─────────────────────────────────────────\n');
  });
}

module.exports = app;
