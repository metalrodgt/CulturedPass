import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { opcionesCookie } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aUsuario, buscarPorGmail, idDe, verificarDisponibilidad } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';
import { rolPorClave } from '../services/claves.service.js';

const RONDAS_BCRYPT = 12;

// Hash falso para comparar cuando el correo no existe: así el tiempo de respuesta
// es parecido exista o no la cuenta (defensa contra ataques cronometrados).
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', RONDAS_BCRYPT);

// Regla 2: la clave ingresada decide el tipo de cuenta que se crea
//  - clave de organizador -> cuenta de organizador (la autoriza un administrador)
//  - clave de visitante   -> cuenta de visitante (la autoriza un organizador)
// Regla 17: nombre, gmail, DNI, teléfono y contraseña son obligatorios (lo valida schemas.js).
export const registro = asyncHandler(async (req, res) => {
  const { nombre, gmail, dni, numero_tel, contrasena, clave } = req.body;

  const rol = await rolPorClave(clave);
  if (!rol) throw new AppError(403, 'La clave de registro es incorrecta');

  await verificarDisponibilidad({ gmail, dni });
  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  try {
    if (rol === 'organizador') {
      await prisma.organizador.create({
        data: { nombre, gmail, dni, numero_tel, contrasena: hash, aprobacion: false, administrador: false },
      });
    } else {
      await prisma.visitante.create({
        data: { nombre, gmail, dni, numero_tel, contrasena: hash, aprobacion: false },
      });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe una cuenta con ese correo o ese DNI');
    }
    throw err;
  }

  res.status(201).json({
    rol,
    mensaje:
      rol === 'organizador'
        ? 'Cuenta de organizador creada. Un administrador debe autorizarla antes de que puedas iniciar sesión.'
        : 'Cuenta de visitante creada. Un organizador debe autorizarla antes de que puedas iniciar sesión.',
  });
});

export const login = asyncHandler(async (req, res) => {
  const { gmail, contrasena } = req.body;
  const encontrado = await buscarPorGmail(gmail);

  const coincide = await bcrypt.compare(contrasena, encontrado?.cuenta.contrasena ?? HASH_FALSO);
  if (!encontrado || !coincide) throw new AppError(401, 'Correo o contraseña incorrectos');

  // Sin autorización no se puede iniciar sesión.
  // (Se revisa DESPUÉS de validar la contraseña para no revelar qué correos existen.)
  if (!encontrado.cuenta.aprobacion) {
    throw new AppError(403, 'Tu cuenta aún no fue autorizada', { rol: encontrado.rol });
  }

  const usuario = aUsuario(encontrado.rol, encontrado.cuenta);
  const token = jwt.sign({ rol: usuario.rol, huella: calcularHuella(encontrado.cuenta) }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(idDe(usuario)),
    expiresIn: `${env.JWT_HORAS}h`,
  });

  res.cookie(COOKIE_NAME, token, { ...opcionesCookie, maxAge: env.JWT_HORAS * 60 * 60 * 1000 });
  res.json({ mensaje: 'Sesión iniciada', usuario });
});

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, opcionesCookie);
  res.json({ mensaje: 'Sesión cerrada' });
};

// Sirve para que el frontend sepa si hay sesión activa al cargar la página
export const me = (req, res) => {
  res.json({ usuario: req.usuario });
};
