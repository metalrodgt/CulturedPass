import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

// Reglas 9 y 10: no se puede tocar a un administrador ni a uno mismo
const obtenerCuentaGestionable = async (id, usuario) => {
  const cuenta = await prisma.organizador.findUnique({
    where: { id_organizador: id },
    select: { id_organizador: true, administrador: true },
  });
  if (!cuenta) throw new AppError(404, 'La cuenta no existe');
  if (cuenta.administrador) {
    throw new AppError(403, 'No se puede deshabilitar, editar ni eliminar una cuenta de administrador');
  }
  if (cuenta.id_organizador === usuario.id_organizador) {
    throw new AppError(403, 'No puedes modificar tu propia cuenta desde la gestión de cuentas');
  }
  return cuenta;
};

// Lista todas las cuentas excepto la propia.
// Excepción (regla 9): si quien consulta es administrador, su cuenta sí aparece (solo lectura).
export const listar = asyncHandler(async (req, res) => {
  const where = req.usuario.administrador ? {} : { id_organizador: { not: req.usuario.id_organizador } };
  const cuentas = await prisma.organizador.findMany({
    where,
    select: SELECT_SEGURO,
    orderBy: { id_organizador: 'asc' },
  });
  res.json({
    cuentas: cuentas.map(({ _count, ...c }) => ({
      ...c,
      total_eventos: _count.eventos,
      protegida: c.administrador, // el frontend puede ocultar editar/deshabilitar/eliminar
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
  await obtenerCuentaGestionable(req.params.id, req.usuario);
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
  await obtenerCuentaGestionable(req.params.id, req.usuario);
  const { nombre, gmail, numero_tel, contrasena } = req.body;
  const data = { nombre, gmail, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const cuenta = await prisma.organizador.update({
      where: { id_organizador: req.params.id },
      data,
      select: SELECT_SEGURO,
    });
    res.json({ mensaje: 'Cuenta actualizada', cuenta });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe otra cuenta con ese correo');
    }
    throw err;
  }
});

// Borrado en cascada: también elimina sus eventos y los boletos de esos eventos
export const eliminar = asyncHandler(async (req, res) => {
  await obtenerCuentaGestionable(req.params.id, req.usuario);
  const [eventos, boletos] = await Promise.all([
    prisma.evento.count({ where: { id_organizador: req.params.id } }),
    prisma.boleto.count({ where: { evento: { id_organizador: req.params.id } } }),
  ]);
  await prisma.organizador.delete({ where: { id_organizador: req.params.id } });
  res.json({ mensaje: 'Cuenta eliminada', eventosEliminados: eventos, boletosEliminados: boletos });
});
