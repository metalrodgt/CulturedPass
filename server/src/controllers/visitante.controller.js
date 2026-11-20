import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { actualizarCuenta, verificarDisponibilidad } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';
import { enviarCuentaAutorizada, enviarDatosActualizados } from '../services/email.service.js';

// Gestión de cuentas de VISITANTES:
//  - Autorizar / deshabilitar: cualquier organizador (la regla 2 exige que un organizador autorice la cuenta).
//  - Editar datos y eliminar la cuenta: SOLO un administrador (ver gestion.routes.js).
//  - Todos los organizadores ven los datos de la cuenta (incluidos DNI y teléfono).
const SELECT_SEGURO = {
  id_visitante: true,
  nombre: true,
  gmail: true,
  dni: true,
  numero_tel: true,
  aprobacion: true,
};

const obtener = async (id) => {
  const cuenta = await prisma.visitante.findUnique({ where: { id_visitante: id } });
  if (!cuenta) throw new AppError(404, 'La cuenta no existe');
  return cuenta;
};

export const listar = asyncHandler(async (req, res) => {
  const cuentas = await prisma.visitante.findMany({ select: SELECT_SEGURO, orderBy: { id_visitante: 'asc' } });
  const esAdmin = req.usuario.administrador;
  res.json({
    cuentas: cuentas.map((c) => ({
      ...c,
      puede_editar: esAdmin,
      puede_gestionar: true, // autorizar / deshabilitar: cualquier organizador
      puede_eliminar: esAdmin,
    })),
  });
});

// Autorizar / deshabilitar. Al deshabilitar, su sesión se cierra sola (middleware autenticarCuenta).
export const cambiarAprobacion = asyncHandler(async (req, res) => {
  const antes = await obtener(req.params.id);
  const cuenta = await prisma.visitante.update({
    where: { id_visitante: req.params.id },
    data: { aprobacion: req.body.aprobacion },
    select: SELECT_SEGURO,
  });
  if (!antes.aprobacion && cuenta.aprobacion) {
    enviarCuentaAutorizada({ cuenta, rol: 'visitante' }).catch(() => {});
  }
  res.json({
    mensaje: cuenta.aprobacion ? 'Cuenta autorizada. Se le avisó por correo.' : 'Cuenta deshabilitada. Su sesión se cerró.',
    cuenta,
  });
});

// Solo administrador. La persona recibe un correo con sus datos actuales (y la contraseña nueva si se cambió).
export const editar = asyncHandler(async (req, res) => {
  const cuenta = await obtener(req.params.id);
  const { nombre, gmail, dni, numero_tel, contrasena } = req.body;

  await verificarDisponibilidad({ gmail, dni }, { rol: 'visitante', id: cuenta.id_visitante });

  const data = { nombre, gmail, dni, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const { antes, actualizada } = await actualizarCuenta('visitante', cuenta.id_visitante, data);
    if (calcularHuella(antes) !== calcularHuella(actualizada)) {
      enviarDatosActualizados({ anterior: antes, nueva: actualizada, contrasenaNueva: contrasena || null }).catch(() => {});
    }
    const { contrasena: _omitida, ...segura } = actualizada;
    res.json({ mensaje: 'Cuenta actualizada. Se le envió un correo con sus datos.', cuenta: segura, sesionCerrada: false });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe otra cuenta con ese correo o ese DNI');
    }
    throw err;
  }
});

// Solo administrador (ver gestion.routes.js). Los boletos que ya emitió esta persona se conservan (siguen siendo válidos y ocupando su cupo)
export const eliminar = asyncHandler(async (req, res) => {
  await obtener(req.params.id);
  await prisma.visitante.delete({ where: { id_visitante: req.params.id } });
  res.json({ mensaje: 'Cuenta eliminada' });
});
