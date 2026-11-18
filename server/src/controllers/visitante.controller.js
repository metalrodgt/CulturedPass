import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verificarDisponibilidad } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';
import { enviarCuentaAutorizada, enviarDatosActualizados } from '../services/email.service.js';

// Gestión de cuentas de VISITANTES. Cualquier organizador aprobado puede autorizar,
// deshabilitar, editar o eliminar visitantes (ver gestion.routes.js).
// Para restringirlo a administradores basta agregar "soloAdministrador" a estas rutas.
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
  res.json({ cuentas });
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

export const editar = asyncHandler(async (req, res) => {
  const cuenta = await obtener(req.params.id);
  const { nombre, gmail, dni, numero_tel, contrasena } = req.body;

  await verificarDisponibilidad({ gmail, dni }, { rol: 'visitante', id: cuenta.id_visitante });

  const data = { nombre, gmail, dni, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const actualizada = await prisma.visitante.update({ where: { id_visitante: req.params.id }, data });
    // Su sesión se cierra sola si cambió algún dato de acceso; además se le avisa por correo
    if (calcularHuella(cuenta) !== calcularHuella(actualizada)) {
      enviarDatosActualizados({ anterior: cuenta, nueva: actualizada, contrasenaCambiada: Boolean(contrasena) }).catch(() => {});
    }
    const { contrasena: _omitida, ...segura } = actualizada;
    res.json({ mensaje: 'Cuenta actualizada', cuenta: segura, sesionCerrada: false });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'Ya existe otra cuenta con ese correo o ese DNI');
    }
    throw err;
  }
});

// Los boletos que ya emitió esta persona se conservan (siguen siendo válidos y ocupando su cupo)
export const eliminar = asyncHandler(async (req, res) => {
  await obtener(req.params.id);
  await prisma.visitante.delete({ where: { id_visitante: req.params.id } });
  res.json({ mensaje: 'Cuenta eliminada' });
});
