import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aFechaDB, aHoraDB, hoyEnZona } from '../utils/fechas.js';
import { serializarEvento } from '../utils/serializar.js';
import { finalizarEventosVencidos } from '../services/evento.service.js';
import { notificarCambiosEvento } from '../services/email.service.js';

const SELECT_PUBLICO = {
  id_evento: true,
  nombre_evento: true,
  nombre_encargado: true,
  numero_telefono: true,
  fecha_evento: true,
  fecha_final: true,
  ubicacion: true,
  hora_inicio: true,
  hora_finalizacion: true,
  portada: true,
  estado: true,
  cupo_total: true,
  cupo_disponible: true,
  descripcion: true,
};

// ===================== PÚBLICO (visitantes) =====================

// Sección "Eventos": solo los disponibles (regla 7)
export const listarDisponibles = asyncHandler(async (req, res) => {
  await finalizarEventosVencidos();
  const eventos = await prisma.evento.findMany({
    where: { estado: 'Disponible' },
    select: SELECT_PUBLICO,
    orderBy: [{ fecha_evento: 'asc' }, { hora_inicio: 'asc' }],
  });
  res.json({ eventos: eventos.map(serializarEvento) });
});

// Página principal: eventos finalizados como "publicidad"
export const listarFinalizados = asyncHandler(async (req, res) => {
  await finalizarEventosVencidos();
  const eventos = await prisma.evento.findMany({
    where: { estado: 'Finalizado' },
    select: SELECT_PUBLICO,
    orderBy: [{ fecha_evento: 'desc' }, { hora_inicio: 'desc' }],
  });
  res.json({ eventos: eventos.map(serializarEvento) });
});

export const obtenerPublico = asyncHandler(async (req, res) => {
  await finalizarEventosVencidos();
  const evento = await prisma.evento.findUnique({
    where: { id_evento: req.params.id },
    select: SELECT_PUBLICO,
  });
  if (!evento) throw new AppError(404, 'El evento no existe');
  res.json({ evento: serializarEvento(evento) });
});

// ===================== GESTIÓN (organizadores) =====================

// Regla 12: cualquier organizador administra cualquier evento
export const listarGestion = asyncHandler(async (req, res) => {
  await finalizarEventosVencidos();
  const eventos = await prisma.evento.findMany({
    include: { organizador: { select: { id_organizador: true, nombre: true } } },
    orderBy: [{ fecha_evento: 'desc' }, { hora_inicio: 'desc' }],
  });
  res.json({
    eventos: eventos.map((e) => ({ ...serializarEvento(e), inscriptos: e.cupo_total - e.cupo_disponible })),
  });
});

const datosDeEvento = (d) => ({
  nombre_evento: d.nombre_evento,
  nombre_encargado: d.nombre_encargado,
  numero_telefono: d.numero_telefono,
  fecha_evento: aFechaDB(d.fecha_evento),
  fecha_final: d.fecha_final ? aFechaDB(d.fecha_final) : null,
  ubicacion: d.ubicacion,
  hora_inicio: aHoraDB(d.hora_inicio),
  hora_finalizacion: aHoraDB(d.hora_finalizacion),
  portada: d.portada,
  descripcion: d.descripcion,
});

export const crear = asyncHandler(async (req, res) => {
  const d = req.body;
  // Regla 16: no se crea con fecha pasada
  if (d.fecha_evento < hoyEnZona()) {
    throw new AppError(400, 'El evento no puede crearse con una fecha pasada');
  }
  const evento = await prisma.evento.create({
    data: {
      ...datosDeEvento(d),
      id_organizador: req.usuario.id_organizador, // lo define el servidor, no el cliente
      cupo_total: d.cupo_total,
      cupo_disponible: d.cupo_total,
    },
  });
  res.status(201).json({ mensaje: 'Evento creado', evento: serializarEvento(evento) });
});

const CAMPOS_NOTIFICABLES = [
  ['nombre_evento', 'el nombre del evento'],
  ['fecha_evento', 'la fecha'],
  ['fecha_final', 'la fecha final'],
  ['hora_inicio', 'la hora de inicio'],
  ['hora_finalizacion', 'la hora de finalización'],
  ['ubicacion', 'la ubicación'],
  ['nombre_encargado', 'el encargado'],
  ['numero_telefono', 'el teléfono del encargado'],
];

export const editar = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const d = req.body;

  const { actualizado, cambios, destinatarios } = await prisma.$transaction(async (tx) => {
    // Bloquea la fila del evento: mientras edito, nadie puede inscribirse/cancelar
    // y alterar el cupo (así la regla 15 se evalúa sobre datos consistentes).
    await tx.$queryRaw`SELECT id_evento FROM evento WHERE id_evento = ${id} FOR UPDATE`;

    const actual = await tx.evento.findUnique({ where: { id_evento: id } });
    if (!actual) throw new AppError(404, 'El evento no existe');
    if (actual.estado === 'Finalizado') {
      throw new AppError(409, 'No se pueden editar eventos finalizados');
    }

    // Regla 15: el cupo total no puede quedar por debajo de los ya inscriptos
    const inscriptos = actual.cupo_total - actual.cupo_disponible;
    if (d.cupo_total < inscriptos) {
      throw new AppError(
        409,
        `No puedes bajar el cupo total por debajo de los ya inscriptos (${inscriptos})`,
        { inscriptos },
      );
    }

    const anterior = serializarEvento(actual);
    if (d.fecha_evento !== anterior.fecha_evento && d.fecha_evento < hoyEnZona()) {
      throw new AppError(400, 'No puedes cambiar la fecha del evento a una fecha pasada');
    }

    // Regla 13: id_organizador NO se modifica (es solo informativo)
    const actualizado = await tx.evento.update({
      where: { id_evento: id },
      data: {
        ...datosDeEvento(d),
        cupo_total: d.cupo_total,
        cupo_disponible: d.cupo_total - inscriptos,
      },
    });

    const nuevo = serializarEvento(actualizado);
    const cambios = CAMPOS_NOTIFICABLES.filter(([campo]) => anterior[campo] !== nuevo[campo]).map(
      ([campo, etiqueta]) => ({ campo: etiqueta, anterior: anterior[campo] ?? 'ninguna', nuevo: nuevo[campo] ?? 'ninguna' }),
    );

    const destinatarios = cambios.length
      ? await tx.boleto.findMany({ where: { id_evento: id }, select: { nombre: true, gmail: true } })
      : [];

    return { actualizado: nuevo, cambios, destinatarios };
  });

  // Los correos se envían en segundo plano, sin hacer esperar la respuesta
  if (cambios.length && destinatarios.length) {
    notificarCambiosEvento({ nombreEvento: actualizado.nombre_evento, cambios, destinatarios }).catch(() => {});
  }

  res.json({ mensaje: 'Evento actualizado', evento: actualizado, notificados: destinatarios.length });
});

export const finalizar = asyncHandler(async (req, res) => {
  const existente = await prisma.evento.findUnique({ where: { id_evento: req.params.id }, select: { id_evento: true } });
  if (!existente) throw new AppError(404, 'El evento no existe');
  const evento = await prisma.evento.update({
    where: { id_evento: req.params.id },
    data: { estado: 'Finalizado' },
  });
  res.json({ mensaje: 'Evento marcado como finalizado', evento: serializarEvento(evento) });
});

// Borrado en cascada: elimina también todos los boletos del evento
export const eliminar = asyncHandler(async (req, res) => {
  const evento = await prisma.evento.findUnique({
    where: { id_evento: req.params.id },
    select: { _count: { select: { boletos: true } } },
  });
  if (!evento) throw new AppError(404, 'El evento no existe');
  await prisma.evento.delete({ where: { id_evento: req.params.id } });
  res.json({ mensaje: 'Evento eliminado', boletosEliminados: evento._count.boletos });
});
