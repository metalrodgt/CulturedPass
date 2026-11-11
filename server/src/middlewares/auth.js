import jwt from 'jsonwebtoken';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leer la cookie (protege el JWT de XSS)
  secure: env.PRODUCCION,
  sameSite: 'lax',
  path: '/',
};

// Reglas 3, 8 y 10: además de verificar el JWT, se consulta la BD en cada petición.
// Si la cuenta fue deshabilitada o eliminada, la sesión deja de funcionar al instante.
export const autenticar = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError(401, 'No has iniciado sesión');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    res.clearCookie(COOKIE_NAME, opcionesCookie);
    throw new AppError(401, 'Tu sesión expiró, inicia sesión nuevamente');
  }

  const organizador = await prisma.organizador.findUnique({
    where: { id_organizador: Number(payload.sub) },
    select: { id_organizador: true, nombre: true, gmail: true, aprobacion: true, administrador: true },
  });

  if (!organizador || !organizador.aprobacion) {
    res.clearCookie(COOKIE_NAME, opcionesCookie);
    throw new AppError(401, 'Tu sesión fue cerrada: la cuenta fue deshabilitada o ya no existe');
  }

  req.usuario = organizador;
  next();
});
