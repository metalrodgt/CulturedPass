import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { actualizarCuenta, verificarDisponibilidad } from '../utils/cuentas.js';
import { calcularHuella } from '../utils/huella.js';
import { enviarCuentaAutorizada, enviarDatosActualizados } from '../services/email.service.js';

// Nunca se devuelve la contraseña (ni su hash)
const SELECT_SEGURO = {
  id_organizador: true,
  nombre: true,
  gmail: true,
  dni: true,
  numero_tel: true,
  aprobacion: true,
  administrador: true,
  _count: { select: { eventos: true } },
};

// Regla 9 (cuentas de ORGANIZADORES):
//  - Cada persona edita SU propia cuenta desde "Mi cuenta" (ver auth.controller.js -> actualizarMiCuenta).
//  - Solo un administrador puede editar los datos de otras cuentas, y nunca las de otro administrador.
//  - Solo un administrador puede autorizar, deshabilitar o eliminar a otros organizadores
//    (nunca a un administrador ni a sí mismo).
const obtenerCuenta = async (id, usuario, accion) => {
  const cuenta = await prisma.organizador.findUnique({ where: { id_organizador: id } });
  if (!cuenta) throw new AppError(404, 'La cuenta no existe');

  if (cuenta.id_organizador === usuario.id_organizador) {
    throw new AppError(403, 'Tu propia cuenta se edita desde "Mi cuenta"');
  }
  if (!usuario.administrador) {
    throw new AppError(403, 'Solo un administrador puede modificar las cuentas de otros organizadores');
  }
  if (cuenta.administrador) {
    throw new AppError(
      403,
      accion === 'editar'
        ? 'No se puede editar la cuenta de otro administrador'
        : 'No se puede deshabilitar ni eliminar una cuenta de administrador',
    );
  }
  return cuenta;
};

// Lista las cuentas de organizador (sin la tuya). Todos los organizadores ven los mismos datos
// (incluidos DNI y teléfono); lo que cambia es qué botones puede usar cada uno.
export const listar = asyncHandler(async (req, res) => {
  const cuentas = await prisma.organizador.findMany({
    where: { id_organizador: { not: req.usuario.id_organizador } },
    select: SELECT_SEGURO,
    orderBy: { id_organizador: 'asc' },
  });
  const esAdmin = req.usuario.administrador;
  res.json({
    cuentas: cuentas.map(({ _count, ...c }) => ({
      ...c,
      total_eventos: _count.eventos,
      puede_editar: esAdmin && !c.administrador,
      puede_gestionar: esAdmin && !c.administrador, // autorizar / deshabilitar
      puede_eliminar: esAdmin && !c.administrador,
    })),
  });
});

// Para mostrar en la confirmación de borrado todo lo que se perdería en cascada
export const impactoEliminacion = asyncHandler(async (req, res) => {
  await obtenerCuenta(req.params.id, req.usuario, 'gestionar');
  const [eventos, boletos] = await Promise.all([
    prisma.evento.count({ where: { id_organizador: req.params.id } }),
    prisma.boleto.count({ where: { evento: { id_organizador: req.params.id } } }),
  ]);
  res.json({ eventos, boletos });
});

// Autorizar / deshabilitar. Al deshabilitar, la sesión se cierra sola (middleware autenticar).
// Al autorizar se envía un correo avisándole a la persona.
export const cambiarAprobacion = asyncHandler(async (req, res) => {
  const antes = await obtenerCuenta(req.params.id, req.usuario, 'gestionar');
  const cuenta = await prisma.organizador.update({
    where: { id_organizador: req.params.id },
    data: { aprobacion: req.body.aprobacion },
    select: SELECT_SEGURO,
  });
  if (!antes.aprobacion && cuenta.aprobacion) {
    enviarCuentaAutorizada({ cuenta, rol: 'organizador' }).catch(() => {});
  }
  res.json({
    mensaje: cuenta.aprobacion ? 'Cuenta autorizada. Se le avisó por correo.' : 'Cuenta desautorizada. Su sesión se cerró.',
    cuenta,
  });
});

// Un administrador edita los datos de otro organizador.
// Esa persona recibe un correo con sus datos actuales (y la contraseña nueva si se cambió).
export const editar = asyncHandler(async (req, res) => {
  const cuenta = await obtenerCuenta(req.params.id, req.usuario, 'editar');
  const { nombre, gmail, dni, numero_tel, contrasena } = req.body;

  await verificarDisponibilidad({ gmail, dni }, { rol: 'organizador', id: cuenta.id_organizador });

  const data = { nombre, gmail, dni, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const { antes, actualizada } = await actualizarCuenta('organizador', cuenta.id_organizador, data);

    // Su sesión se cierra sola en su próxima petición (cambió la huella de sus datos de acceso)
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

// Cantidad de cuentas de organizador sin autorizar (para el aviso de la barra de navegación).
// Solo lo consulta un administrador (ver gestion.routes.js), que es quien puede autorizarlas.
export const pendientes = asyncHandler(async (req, res) => {
  const organizadores = await prisma.organizador.count({ where: { aprobacion: false } });
  res.json({ organizadores });
});
