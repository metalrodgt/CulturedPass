import { createHash, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { opcionesCookie } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { calcularHuella } from '../utils/huella.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const RONDAS_BCRYPT = 12;

// Hash falso para comparar cuando el correo no existe: así el tiempo de respuesta
// es parecido exista o no la cuenta (defensa contra ataques cronometrados).
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', RONDAS_BCRYPT);

// Compara la clave ingresada con CLAVE_REGISTRO en tiempo constante
const claveValida = (ingresada) => {
  const a = createHash('sha256').update(String(ingresada)).digest();
  const b = createHash('sha256').update(env.CLAVE_REGISTRO).digest();
  return timingSafeEqual(a, b);
};

const datosPublicos = (o) => ({
  id_organizador: o.id_organizador,
  nombre: o.nombre,
  gmail: o.gmail,
  administrador: o.administrador,
});

// Regla 6: la cuenta se crea sin aprobar (aprobacion=false, administrador=false)
export const registro = asyncHandler(async (req, res) => {
  const { nombre, gmail, numero_tel, contrasena, clave } = req.body;

  // Regla 2: sin la clave correcta no se puede crear la cuenta
  if (!claveValida(clave)) throw new AppError(403, 'La clave de registro es incorrecta');

  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);
  try {
    await prisma.organizador.create({
      data: { nombre, gmail, numero_tel, contrasena: hash, aprobacion: false, administrador: false },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe una cuenta con ese correo');
    }
    throw err;
  }
  res.status(201).json({
    mensaje: 'Cuenta creada. Un organizador debe aprobarla antes de que puedas iniciar sesión.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const { gmail, contrasena } = req.body;
  const organizador = await prisma.organizador.findUnique({ where: { gmail } });

  const coincide = await bcrypt.compare(contrasena, organizador?.contrasena ?? HASH_FALSO);
  if (!organizador || !coincide) throw new AppError(401, 'Correo o contraseña incorrectos');

  // Regla 6: sin aprobación no se puede iniciar sesión
  // (se revisa DESPUÉS de validar la contraseña para no revelar qué correos existen)
  if (!organizador.aprobacion) {
    throw new AppError(403, 'Tu cuenta aún no fue aprobada por un organizador');
  }

  const token = jwt.sign({ huella: calcularHuella(organizador) }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(organizador.id_organizador),
    expiresIn: `${env.JWT_HORAS}h`,
  });

  res.cookie(COOKIE_NAME, token, { ...opcionesCookie, maxAge: env.JWT_HORAS * 60 * 60 * 1000 });
  res.json({ mensaje: 'Sesión iniciada', usuario: datosPublicos(organizador) });
});

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, opcionesCookie);
  res.json({ mensaje: 'Sesión cerrada' });
};

// Sirve para que el frontend sepa si hay sesión activa al cargar la página
export const me = (req, res) => {
  res.json({ usuario: datosPublicos(req.usuario) });
};
