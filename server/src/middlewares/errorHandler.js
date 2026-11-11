import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError.js';

export const noEncontrado = (req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
};

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
  console.error('💥 Error no controlado:', err);
  return res.status(500).json({ mensaje: 'Error interno del servidor' });
};
