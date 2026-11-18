import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { COOKIE_NAME } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { opcionesCookie } from '../middlewares/auth.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verificarDisponibilidad } from '../utils/cuentas.js';
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

// Regla 9 (quién puede hacer qué con una cuenta de organizador):
//  - EDITAR:  cada organizador edita SU cuenta. Solo un administrador edita las de otros organizadores
//             (nunca las de otro administrador).
//  - AUTORIZAR / DESHABILITAR / ELIMINAR: solo un administrador, sobre cuentas que no sean de administrador
//             ni la suya.
const permisos = (usuario, cuenta) => {
  const esPropia = cuenta.id_organizador === usuario.id_organizador;
  return {
    esPropia,
    puedeEditar: esPropia || (usuario.administrador && !cuenta.administrador),
    puedeGestionar: usuario.administrador && !cuenta.administrador && !esPropia,
  };
};

const obtenerCuenta = async (id, usuario, accion) => {
  const cuenta = await prisma.organizador.findUnique({ where: { id_organizador: id } });
  if (!cuenta) throw new AppError(404, 'La cuenta no existe');
  const p = permisos(usuario, cuenta);

  if (accion === 'editar' && !p.puedeEditar) {
    throw new AppError(
      403,
      cuenta.administrador
        ? 'No se puede editar la cuenta de otro administrador'
        : 'Solo un administrador puede editar las cuentas de otros organizadores',
    );
  }
  if (accion === 'gestionar' && !p.puedeGestionar) {
    throw new AppError(
      403,
      cuenta.administrador
        ? 'No se puede deshabilitar ni eliminar una cuenta de administrador'
        : p.esPropia
          ? 'No puedes deshabilitar ni eliminar tu propia cuenta'
          : 'Solo un administrador puede autorizar, deshabilitar o eliminar cuentas de organizadores',
    );
  }
  return { cuenta, esPropia: p.esPropia };
};

// Lista las cuentas de organizador. Cada fila indica qué puede hacer quien consulta.
// El DNI solo lo ven los administradores y el dueño de la cuenta.
export const listar = asyncHandler(async (req, res) => {
  const cuentas = await prisma.organizador.findMany({
    select: SELECT_SEGURO,
    orderBy: { id_organizador: 'asc' },
  });
  res.json({
    cuentas: cuentas.map(({ _count, ...c }) => {
      const p = permisos(req.usuario, c);
      return {
        ...c,
        dni: req.usuario.administrador || p.esPropia ? c.dni : null,
        total_eventos: _count.eventos,
        es_propia: p.esPropia,
        puede_editar: p.puedeEditar,
        puede_gestionar: p.puedeGestionar,
      };
    }),
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
  const { cuenta: antes } = await obtenerCuenta(req.params.id, req.usuario, 'gestionar');
  const cuenta = await prisma.organizador.update({
    where: { id_organizador: req.params.id },
    data: { aprobacion: req.body.aprobacion },
    select: SELECT_SEGURO,
  });
  if (!antes.aprobacion && cuenta.aprobacion) {
    enviarCuentaAutorizada({ cuenta, rol: 'organizador' }).catch(() => {});
  }
  res.json({
    mensaje: cuenta.aprobacion ? 'Cuenta autorizada. Se le avisó por correo.' : 'Cuenta deshabilitada. Su sesión se cerró.',
    cuenta,
  });
});

export const editar = asyncHandler(async (req, res) => {
  const { cuenta, esPropia } = await obtenerCuenta(req.params.id, req.usuario, 'editar');
  const { nombre, gmail, dni, numero_tel, contrasena } = req.body;

  await verificarDisponibilidad({ gmail, dni }, { rol: 'organizador', id: cuenta.id_organizador });

  const data = { nombre, gmail, dni, numero_tel };
  if (contrasena) data.contrasena = await bcrypt.hash(contrasena, 12);

  try {
    const actualizada = await prisma.organizador.update({ where: { id_organizador: req.params.id }, data });

    // Si cambió algún dato de acceso, esa cuenta debe iniciar sesión de nuevo.
    // (Las sesiones de OTRAS cuentas se cierran solas en su próxima petición, ver middleware autenticar.)
    const cambioDatos = calcularHuella(cuenta) !== calcularHuella(actualizada);
    const sesionCerrada = esPropia && cambioDatos;
    if (sesionCerrada) res.clearCookie(COOKIE_NAME, opcionesCookie);

    // Regla 9: si un administrador edita la cuenta de otro organizador, se le envía un correo con los datos nuevos
    if (!esPropia && cambioDatos) {
      enviarDatosActualizados({ anterior: cuenta, nueva: actualizada, contrasenaCambiada: Boolean(contrasena) }).catch(() => {});
    }

    const { contrasena: _omitida, ...segura } = actualizada;
    res.json({ mensaje: 'Cuenta actualizada', cuenta: segura, sesionCerrada });
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
