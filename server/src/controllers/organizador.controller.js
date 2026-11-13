import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { COOKIE_NAME, env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { opcionesCookie } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calcularHuella } from '../utils/huella.js';

// Nunca se devuelve la contraseña (ni su hash)
const SELECT_SEGURO = {
  id_organizador: true,
  nombre: true,
  gmail: true,
  numero_tel: true,
  aprobacion: true,
  administrador: true,
  _count: { select: { eventos: true } },
};

// Regla 9:
//  - Un administrador NUNCA puede ser deshabilitado ni eliminado.
//  - Un administrador solo puede ser editado por sí mismo (no por otros, ni siquiera otros administradores).
//  - Una cuenta no administradora no puede modificarse a sí misma desde la gestión de cuentas.
const obtenerCuenta = async (id, usuario, accion) => {
  const cuenta = await prisma.organizador.findUnique({ where: { id_organizador: id } });
  if (!cuenta) throw new AppError(404, 'La cuenta no existe');
  const esPropia = cuenta.id_organizador === usuario.id_organizador;

  if (accion === 'editar') {
    if (cuenta.administrador && !esPropia) {
      throw new AppError(403, 'No se puede editar la cuenta de otro administrador');
    }
    if (!cuenta.administrador && esPropia) {
      throw new AppError(403, 'No puedes modificar tu propia cuenta desde la gestión de cuentas');
    }
  } else {
    if (cuenta.administrador) {
      throw new AppError(403, 'No se puede deshabilitar ni eliminar una cuenta de administrador');
    }
    if (esPropia) {
      throw new AppError(403, 'No puedes modificar tu propia cuenta desde la gestión de cuentas');
    }
  }
  return { cuenta, esPropia };
};

// Lista todas las cuentas excepto la propia.
// Excepción: si quien consulta es administrador, su cuenta sí aparece (y puede editarla).
export const listar = asyncHandler(async (req, res) => {
  const yo = req.usuario.id_organizador;
  const where = req.usuario.administrador ? {} : { id_organizador: { not: yo } };
  const cuentas = await prisma.organizador.findMany({
    where,
    select: SELECT_SEGURO,
    orderBy: { id_organizador: 'asc' },
  });
  res.json({
    cuentas: cuentas.map(({ _count, ...c }) => ({
      ...c,
      total_eventos: _count.eventos,
      es_propia: c.id_organizador === yo,
      puede_editar: !c.administrador || c.id_organizador === yo,
      puede_gestionar: !c.administrador, // deshabilitar / eliminar
    })),
  });
});

// Para mostrar en la confirmación de borrado todo lo que se perdería en cascada
export const impactoEliminacion = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const existe = await prisma.organizador.findUnique({ where: { id_organizador: id }, select: { id_organizador: true } });
  if (!existe) throw new AppError(404, 'La cuenta no existe');
  const [eventos, boletos] = await Promise.all([
    prisma.evento.count({ where: { id_organizador: id } }),
    prisma.boleto.count({ where: { evento: { id_organizador: id } } }),
  ]);
  res.json({ eventos, boletos });
});

// Habilitar / deshabilitar. Al deshabilitar, la sesión se cierra sola (middleware autenticar)
export const cambiarAprobacion = asyncHandler(async (req, res) => {
  await obtenerCuenta(req.params.id, req.usuario, 'gestionar');
  const cuenta = await prisma.organizador.update({
    where: { id_organizador: req.params.id },
    data: { aprobacion: req.body.aprobacion },
    select: SELECT_SEGURO,
  });
  res.json({
    mensaje: cuenta.aprobacion ? 'Cuenta habilitada' : 'Cuenta deshabilitada. Su sesión se cerró.',
    cuenta,
  });
});

export const editar = asyncHandler(async (req, res) => {
  const { cuenta, esPropia } = await obtenerCuenta(req.params.id, req.usuario, 'editar');
  const { nombre, gmail, numero_tel, contrasena } = req.body;
  const data = { nombre, gmail, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const actualizada = await prisma.organizador.update({
      where: { id_organizador: req.params.id },
      data,
    });

    // Si cambió algún dato de acceso, esa cuenta debe iniciar sesión de nuevo.
    // (Las sesiones de OTRAS cuentas se cierran solas en su próxima petición, ver middleware autenticar.)
    const cambioDatos = calcularHuella(cuenta) !== calcularHuella(actualizada);
    const sesionCerrada = esPropia && cambioDatos;
    if (sesionCerrada) res.clearCookie(COOKIE_NAME, opcionesCookie);

    const { contrasena: _omitida, ...segura } = actualizada;
    res.json({ mensaje: 'Cuenta actualizada', cuenta: segura, sesionCerrada });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe otra cuenta con ese correo');
    }
    throw err;
  }
});

// Borrado en cascada: también elimina sus eventos y los boletos de esos eventos
export const eliminar = asyncHandler(async (req, res) => {
  await obtenerCuenta(req.params.id, req.usuario, 'gestionar');
  const [eventos, boletos] = await Promise.all([
    prisma.evento.count({ where: { id_organizador: req.params.id } }),
    prisma.boleto.count({ where: { evento: { id_organizador: req.params.id } } }),
  ]);
  await prisma.organizador.delete({ where: { id_organizador: req.params.id } });
  res.json({ mensaje: 'Cuenta eliminada', eventosEliminados: eventos, boletosEliminados: boletos });
});

// Regla 2: solo un administrador (ver ruta) puede ver la clave de registro
export const verClave = (req, res) => {
  res.json({ clave: env.CLAVE_REGISTRO });
};
