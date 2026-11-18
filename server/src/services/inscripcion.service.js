import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { generarCodigo } from '../utils/codigo.js';
import { finalizarEventosVencidos } from './evento.service.js';

const MAX_REINTENTOS_CODIGO = 5;

// Inscribe a una cuenta (organizador o visitante) en un evento.
//  - Regla 2: los datos (nombre, gmail, DNI, teléfono) se toman de la cuenta con sesión iniciada.
//  - Regla 23: un organizador no puede inscribirse a un evento que él mismo creó.
//  - Todo ocurre en UNA transacción: el cupo se resta con un UPDATE condicional atómico
//    ("cupo_disponible > 0"), así dos personas no se llevan el último lugar a la vez.
export const inscribir = async (idEvento, usuario) => {
  await finalizarEventosVencidos();

  const evento = await prisma.evento.findUnique({
    where: { id_evento: idEvento },
    select: { id_organizador: true },
  });
  if (!evento) throw new AppError(404, 'El evento no existe');

  if (usuario.rol === 'organizador' && evento.id_organizador === usuario.id_organizador) {
    throw new AppError(403, 'No puedes inscribirte a un evento que tú mismo creaste');
  }

  for (let intento = 0; intento < MAX_REINTENTOS_CODIGO; intento += 1) {
    const codigo = generarCodigo();
    try {
      // eslint-disable-next-line no-await-in-loop
      return await prisma.$transaction(async (tx) => {
        // Una persona (mismo correo o mismo DNI) no puede inscribirse dos veces al mismo evento
        const duplicado = await tx.boleto.findFirst({
          where: { id_evento: idEvento, OR: [{ gmail: usuario.gmail }, { dni: usuario.dni }] },
          select: { id_boleto: true },
        });
        if (duplicado) throw new AppError(409, 'Ya estás inscripto en este evento');

        const resultado = await tx.evento.updateMany({
          where: { id_evento: idEvento, estado: 'Disponible', cupo_disponible: { gt: 0 } },
          data: { cupo_disponible: { decrement: 1 } },
        });

        if (resultado.count === 0) {
          const actual = await tx.evento.findUnique({ where: { id_evento: idEvento }, select: { estado: true } });
          if (!actual) throw new AppError(404, 'El evento no existe');
          if (actual.estado === 'Finalizado') throw new AppError(409, 'El evento ya finalizó');
          throw new AppError(409, 'El evento está agotado: no quedan cupos disponibles');
        }

        const boleto = await tx.boleto.create({
          data: {
            id_evento: idEvento,
            nombre: usuario.nombre,
            gmail: usuario.gmail,
            dni: usuario.dni,
            numero_tel: usuario.numero_tel,
            codigo,
            // Vínculo con la cuenta: permite mostrar "Mis boletos"
            id_visitante: usuario.rol === 'visitante' ? usuario.id_visitante : null,
            id_organizador_inscrito: usuario.rol === 'organizador' ? usuario.id_organizador : null,
          },
          select: { id_boleto: true, codigo: true, nombre: true, gmail: true },
        });

        const datosEvento = await tx.evento.findUnique({
          where: { id_evento: idEvento },
          select: {
            id_evento: true,
            nombre_evento: true,
            fecha_evento: true,
            fecha_final: true,
            hora_inicio: true,
            hora_finalizacion: true,
            ubicacion: true,
            cupo_disponible: true,
          },
        });

        return { boleto, evento: datosEvento };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Si chocó el código aleatorio (rarísimo), se reintenta con otro código.
        if (String(err.meta?.target ?? '').includes('codigo')) continue;
        // Si no, fue una carrera con la misma persona (correo o DNI ya inscripto)
        throw new AppError(409, 'Ya estás inscripto en este evento');
      }
      throw err;
    }
  }
  throw new AppError(500, 'No se pudo generar un código único, intenta nuevamente');
};
