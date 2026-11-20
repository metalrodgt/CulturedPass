import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

export const noEncontrado = (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
};

// ¿El error se debe a la conexión con la base (y no a un bug del código)?
const CODIGOS_DE_CONEXION = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024'];
const esErrorDeConexion = (err) =>
  CODIGOS_DE_CONEXION.includes(err?.code) ||
  err instanceof Prisma.PrismaClientInitializationError ||
  /prepared statement|Connection terminated|Server has closed the connection|ECONNRESET/i.test(err?.message ?? '');

// Manejador central de errores. Nunca se envían detalles internos al cliente.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ mensaje: err.message, ...err.datos });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'La petición es demasiado grande' });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
  }
  // Problema de conexión con la base (ya se reintentó solo): 503 = "temporalmente no disponible"
  if (esErrorDeConexion(err)) {
    console.error('🔌 Error de conexión con la base de datos:', err.code ?? '', err.message);
    return res
      .status(503)
      .json({ mensaje: 'La base de datos está ocupada. Intenta de nuevo en unos segundos.' });
  }
  console.error('💥 Error no controlado:', err);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
};
