import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { REGEX_CODIGO } from '../utils/codigo.js';
import { serializarEvento } from '../utils/serializar.js';
import { inscribir } from '../services/inscripcion.service.js';
import { finalizarEventosVencidos } from '../services/evento.service.js';
import { enviarBoletoPorCorreo } from '../services/email.service.js';
import { limpiarIntentos, registrarFallo, segundosDeBloqueo } from '../middlewares/intentosCancelacion.js';

// ===================== PÚBLICO =====================

// Reglas 1, 2, 5, 14, 17, 18, 23
export const inscribirse = asyncHandler(async (req, res) => {
  const { boleto, evento } = await inscribir(req.params.id, req.body);
  const eventoTexto = serializarEvento(evento);

  // Correo en segundo plano (si falla, la inscripción ya quedó guardada)
  enviarBoletoPorCorreo({ evento: eventoTexto, boleto }).catch(() => {});

  // Regla 18: el código se devuelve UNA sola vez, para mostrarlo en la ventana modal
  res.status(201).json({
    mensaje: 'Inscripción exitosa. Guarda tu código: no volverá a mostrarse.',
    boleto: { codigo: boleto.codigo, nombre: boleto.nombre, gmail: boleto.gmail },
    evento: {
      id_evento: eventoTexto.id_evento,
      nombre_evento: eventoTexto.nombre_evento,
      fecha_evento: eventoTexto.fecha_evento,
      hora_inicio: eventoTexto.hora_inicio,
      hora_finalizacion: eventoTexto.hora_finalizacion,
      ubicacion: eventoTexto.ubicacion,
    },
  });
});

// Reglas 19, 20, 21, 22 + límite de 3 intentos con cooldown
export const cancelar = asyncHandler(async (req, res) => {
  const ip = req.ip;

  const espera = segundosDeBloqueo(ip);
  if (espera > 0) {
    throw new AppError(429, 'Demasiados intentos fallidos. Intenta nuevamente más tarde.', {
      segundosRestantes: espera,
    });
  }

  // Un código inexistente (o de un evento ya finalizado) cuenta como intento fallido
  const fallar = () => {
    const r = registrarFallo(ip);
    if (r.bloqueado) {
      throw new AppError(429, 'Demasiados intentos fallidos. Intenta nuevamente más tarde.', {
        segundosRestantes: r.segundosRestantes,
      });
    }
    throw new AppError(404, 'El código ingresado no es válido', { intentosRestantes: r.intentosRestantes });
  };

  const { codigo } = req.body;
  if (!REGEX_CODIGO.test(codigo)) fallar();

  await finalizarEventosVencidos();

  const boleto = await prisma.boleto.findUnique({
    where: { codigo },
    select: { id_boleto: true, id_evento: true, estado: true, evento: { select: { estado: true } } },
  });

  // Regla 21: si el evento ya finalizó, el boleto no se puede eliminar
  if (!boleto || boleto.evento.estado === 'Finalizado') fallar();

  // Regla 20
  if (boleto.estado === 'Presente') {
    throw new AppError(409, 'No se puede cancelar un boleto que ya fue marcado como presente');
  }

  await prisma.$transaction(async (tx) => {
    // Solo borra si sigue "Ausente" (por si el organizador lo marcó justo ahora)
    const borrados = await tx.boleto.deleteMany({
      where: { id_boleto: boleto.id_boleto, estado: 'Ausente' },
    });
    if (borrados.count === 0) {
      throw new AppError(409, 'No se puede cancelar un boleto que ya fue marcado como presente');
    }
    // Se devuelve el lugar al cupo
    await tx.evento.update({
      where: { id_evento: boleto.id_evento },
      data: { cupo_disponible: { increment: 1 } },
    });
  });

  limpiarIntentos(ip);
  // Regla 22: el boleto se borró, el correo queda libre para volver a inscribirse
  res.json({ mensaje: 'Inscripción cancelada. Tu lugar fue liberado.' });
});

// ===================== GESTIÓN (organizadores) =====================

export const listarPorEvento = asyncHandler(async (req, res) => {
  const idEvento = req.params.id;
  const { estado, q } = req.query;

  const evento = await prisma.evento.findUnique({
    where: { id_evento: idEvento },
    select: { id_evento: true, nombre_evento: true, fecha_evento: true, hora_inicio: true, hora_finalizacion: true, estado: true },
  });
  if (!evento) throw new AppError(404, 'El evento no existe');

  const where = {
    id_evento: idEvento,
    ...(estado && { estado }),
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { gmail: { contains: q.toLowerCase() } },
        { codigo: { contains: q.toUpperCase() } },
      ],
    }),
  };

  const [boletos, total, presentes] = await Promise.all([
    prisma.boleto.findMany({ where, orderBy: { fecha_creacion: 'asc' } }),
    prisma.boleto.count({ where: { id_evento: idEvento } }),
    prisma.boleto.count({ where: { id_evento: idEvento, estado: 'Presente' } }),
  ]);

  res.json({ evento: serializarEvento(evento), resumen: { total, presentes }, boletos });
});

// Botón "estado": Ausente <-> Presente (guarda la hora de asistencia)
export const marcarAsistencia = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { estado } = req.body;

  const datos =
    estado === 'Presente'
      ? { estado: 'Presente', hora_asistencia: new Date() }
      : { estado: 'Ausente', hora_asistencia: null };

  // Solo cambia si el estado actual es el opuesto (evita doble marcado por doble clic)
  const resultado = await prisma.boleto.updateMany({
    where: { id_boleto: id, estado: estado === 'Presente' ? 'Ausente' : 'Presente' },
    data: datos,
  });

  if (resultado.count === 0) {
    const existe = await prisma.boleto.findUnique({ where: { id_boleto: id }, select: { id_boleto: true } });
    if (!existe) throw new AppError(404, 'El boleto no existe');
    throw new AppError(409, `El boleto ya estaba marcado como ${estado}`);
  }

  const boleto = await prisma.boleto.findUnique({ where: { id_boleto: id } });
  res.json({ mensaje: `Boleto marcado como ${estado}`, boleto });
});
