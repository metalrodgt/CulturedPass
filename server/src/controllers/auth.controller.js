import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { opcionesCookie } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { actualizarCuenta, aUsuario, buscarPorGmail, idDe, verificarDisponibilidad } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';
import { claveOrganizadorValida } from '../services/claves.service.js';
import { enviarRecuperacion } from '../services/email.service.js';

const RONDAS_BCRYPT = 12;

// Hash falso para comparar cuando el correo no existe: así el tiempo de respuesta
// es parecido exista o no la cuenta (defensa contra ataques cronometrados).
const HASH_FALSO = bcrypt.hashSync('contrasena-falsa-para-igualar-tiempos', RONDAS_BCRYPT);

// Regla 2: la CLAVE es opcional y decide el tipo de cuenta que se crea
//  - sin clave                   -> cuenta de VISITANTE (queda autorizada al instante)
//  - con la clave de organizador -> cuenta de ORGANIZADOR (la autoriza un administrador)
//  - con una clave incorrecta    -> error (no se crea ninguna cuenta)
// Regla 17: nombre, gmail, DNI, teléfono y contraseña son obligatorios (lo valida schemas.js).
export const registro = asyncHandler(async (req, res) => {
  const { nombre, gmail, dni, numero_tel, contrasena, clave } = req.body;

  let rol = 'visitante';
  if (clave) {
    if (!(await claveOrganizadorValida(clave))) {
      throw new AppError(403, 'La clave es incorrecta. Déjala vacía si quieres crear una cuenta de visitante.');
    }
    rol = 'organizador';
  }

  await verificarDisponibilidad({ gmail, dni });
  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  try {
    if (rol === 'organizador') {
      await prisma.organizador.create({
        data: { nombre, gmail, dni, numero_tel, contrasena: hash, aprobacion: false, administrador: false },
      });
    } else {
      await prisma.visitante.create({
        data: { nombre, gmail, dni, numero_tel, contrasena: hash, aprobacion: true },
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
        : 'Cuenta de visitante creada. Ya puedes iniciar sesión.',
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

// ===================== MI CUENTA =====================
// Cualquier cuenta (organizador o visitante) edita SUS propios datos.
// Si cambia algún dato de acceso, la sesión se cierra y debe iniciar sesión con los datos nuevos.
export const actualizarMiCuenta = asyncHandler(async (req, res) => {
  const u = req.usuario;
  const id = idDe(u);
  const { nombre, gmail, dni, numero_tel, contrasena } = req.body;

  await verificarDisponibilidad({ gmail, dni }, { rol: u.rol, id });

  const data = { nombre, gmail, dni, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, RONDAS_BCRYPT);

  try {
    const { antes, actualizada } = await actualizarCuenta(u.rol, id, data);
    const sesionCerrada = calcularHuella(antes) !== calcularHuella(actualizada);
    if (sesionCerrada) res.clearCookie(COOKIE_NAME, opcionesCookie);
    res.json({ mensaje: 'Datos actualizados', usuario: aUsuario(u.rol, actualizada), sesionCerrada });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe una cuenta con ese correo o ese DNI');
    }
    throw err;
  }
});

// ===================== RECUPERACIÓN DE CONTRASEÑA =====================
// El enlace lleva un token firmado (con otra clave distinta a la de las sesiones) que vence en 1 hora.
// Incluye la "huella" de la cuenta: en cuanto la contraseña cambia, el enlace deja de servir (un solo uso).
const SECRETO_RECUPERACION = `${env.JWT_SECRET}:recuperacion`;
const MENSAJE_ENLACE_INVALIDO = 'El enlace es inválido o venció. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".';

export const solicitarRecuperacion = asyncHandler(async (req, res) => {
  const encontrado = await buscarPorGmail(req.body.gmail);

  if (encontrado) {
    const { rol, cuenta } = encontrado;
    const token = jwt.sign({ rol, huella: calcularHuella(cuenta) }, SECRETO_RECUPERACION, {
      algorithm: 'HS256',
      subject: String(rol === 'organizador' ? cuenta.id_organizador : cuenta.id_visitante),
      expiresIn: '1h',
    });
    const base = env.CLIENT_URL.replace(/\/+$/, '');
    const enlace = `${base}/cambiar-contrasena?token=${encodeURIComponent(token)}`;
    // En segundo plano: así la respuesta tarda igual exista o no el correo
    enviarRecuperacion({ cuenta, enlace }).catch(() => {});
  }

  // Siempre la misma respuesta: no revela qué correos tienen cuenta
  res.json({ mensaje: 'Si el correo está registrado, te enviamos un enlace para cambiar tu contraseña.' });
});

export const restablecerContrasena = asyncHandler(async (req, res) => {
  const { token, contrasena } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, SECRETO_RECUPERACION, { algorithms: ['HS256'] });
  } catch {
    throw new AppError(400, MENSAJE_ENLACE_INVALIDO);
  }

  const id = Number(payload.sub);
  const cuenta =
    payload.rol === 'organizador'
      ? await prisma.organizador.findUnique({ where: { id_organizador: id } })
      : payload.rol === 'visitante'
        ? await prisma.visitante.findUnique({ where: { id_visitante: id } })
        : null;

  if (!cuenta || payload.huella !== calcularHuella(cuenta)) {
    throw new AppError(400, MENSAJE_ENLACE_INVALIDO);
  }

  const hash = await bcrypt.hash(contrasena, RONDAS_BCRYPT);
  if (payload.rol === 'organizador') {
    await prisma.organizador.update({ where: { id_organizador: id }, data: { contrasena: hash } });
  } else {
    await prisma.visitante.update({ where: { id_visitante: id }, data: { contrasena: hash } });
  }

  res.json({ mensaje: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
});
