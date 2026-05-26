/**
 * Middleware global de manejo de errores — Express 5
 * Captura errores de Mongoose, Multer y errores generales.
 */
const errorHandler = (err, req, res, next) => {
  // Log en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
  }

  // Mongoose: error de validación
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: 'Error de validación', details });
  }

  // Mongoose: ID inválido
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'ID no válido' });
  }

  // Mongoose: clave duplicada
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? 'campo';
    return res.status(409).json({ success: false, error: `El valor de '${field}' ya existe` });
  }

  // Multer: archivo muy grande
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, error: 'La imagen no puede superar 5 MB' });
  }

  // Multer: tipo de archivo inválido
  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ success: false, error: err.message });
  }

  // Multer: campo inesperado
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, error: 'Campo de archivo no permitido' });
  }

  // JWT: token inválido
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token expirado' });
  }

  // Error genérico — en producción no exponemos el mensaje interno
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status ?? 500).json({
    success: false,
    error: isProd ? 'Error interno del servidor' : (err.message ?? 'Error interno del servidor'),
  });
};

module.exports = errorHandler;
