import jwt from 'jsonwebtoken';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calcularHuella } from '../utils/huella.js';

export const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leer la cookie (protege el JWT de XSS)
  secure: env.PRODUCCION,
  sameSite: 'lax',
  path: '/',
};

// Reglas 3, 8, 9 y 10: además de verificar el JWT, se consulta la BD en cada petición.
//  - Si la cuenta fue deshabilitada o eliminada, la sesión se cierra al instante.
//  - Si se modificaron sus datos (nombre, correo, teléfono o contraseña), también:
//    debe iniciar sesión de nuevo con los datos nuevos.
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
  });

  if (!organizador || !organizador.aprobacion) {
    res.clearCookie(COOKIE_NAME, opcionesCookie);
    throw new AppError(401, 'Tu sesión fue cerrada: la cuenta fue deshabilitada o ya no existe');
  }

  if (payload.huella !== calcularHuella(organizador)) {
    res.clearCookie(COOKIE_NAME, opcionesCookie);
    throw new AppError(401, 'Tus datos fueron modificados: inicia sesión nuevamente');
  }

  // Solo se expone lo necesario (nunca la contraseña)
  req.usuario = {
    id_organizador: organizador.id_organizador,
    nombre: organizador.nombre,
    gmail: organizador.gmail,
    aprobacion: organizador.aprobacion,
    administrador: organizador.administrador,
  };
  next();
});

// Regla 2: la clave de registro solo la puede ver un administrador
export const soloAdministrador = (req, res, next) => {
  if (!req.usuario?.administrador) {
    throw new AppError(403, 'Solo un administrador puede hacer esto');
  }
  next();
};
