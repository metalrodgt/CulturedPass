import jwt from 'jsonwebtoken';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aUsuario } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';

export const opcionesCookie = {
  httpOnly: true, // JavaScript del navegador no puede leer la cookie (protege el JWT de XSS)
  secure: env.PRODUCCION,
  sameSite: 'lax',
  path: '/',
};

const cerrar = (res, mensaje) => {
  res.clearCookie(COOKIE_NAME, opcionesCookie);
  throw new AppError(401, mensaje);
};

// Verifica el JWT y consulta la BD en cada petición:
//  - Cuenta deshabilitada o eliminada -> sesión cerrada al instante.
//  - Datos de acceso modificados (nombre, correo, DNI, teléfono o contraseña) -> debe iniciar sesión de nuevo.
// Deja la cuenta en req.usuario (organizador o visitante, ver utils/cuentas.js -> aUsuario).
const cargarSesion = async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new AppError(401, 'No has iniciado sesión');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    cerrar(res, 'Tu sesión expiró, inicia sesión nuevamente');
  }

  const id = Number(payload.sub);
  let cuenta = null;
  if (payload.rol === 'organizador') {
    cuenta = await prisma.organizador.findUnique({ where: { id_organizador: id } });
  } else if (payload.rol === 'visitante') {
    cuenta = await prisma.visitante.findUnique({ where: { id_visitante: id } });
  }

  if (!cuenta || !cuenta.aprobacion) {
    cerrar(res, 'Tu sesión fue cerrada: la cuenta fue deshabilitada o ya no existe');
  }
  if (payload.huella !== calcularHuella(cuenta)) {
    cerrar(res, 'Tus datos fueron modificados: inicia sesión nuevamente');
  }

  req.usuario = aUsuario(payload.rol, cuenta); // nunca incluye la contraseña
};

// Cualquier cuenta con sesión (organizador o visitante): inscripciones y /auth/me
export const autenticarCuenta = asyncHandler(async (req, res, next) => {
  await cargarSesion(req, res);
  next();
});

// Solo organizadores (todo lo que está bajo /api/gestion)
export const autenticar = asyncHandler(async (req, res, next) => {
  await cargarSesion(req, res);
  if (req.usuario.rol !== 'organizador') {
    throw new AppError(403, 'Esta sección es solo para organizadores');
  }
  next();
});

// Solo administradores (claves de registro)
export const soloAdministrador = (req, res, next) => {
  if (!req.usuario?.administrador) {
    throw new AppError(403, 'Solo un administrador puede hacer esto');
  }
  next();
};
