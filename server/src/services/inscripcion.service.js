import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { generarCodigo } from '../utils/codigo.js';
import { finalizarEventosVencidos } from './evento.service.js';

const MAX_REINTENTOS_CODIGO = 5;

// Inscribe a un visitante en un evento.
//  - Todo ocurre en UNA transacción de base de datos.
//  - El cupo se resta con un UPDATE condicional ("cupo_disponible > 0") que es atómico:
//    si dos personas piden el último lugar a la vez, Postgres deja pasar solo a una.
//  - Si algo falla después de restar (ej. correo duplicado), la transacción se revierte
//    y el cupo vuelve a su valor original.
export const inscribir = async (idEvento, { nombre, gmail }) => {
  await finalizarEventosVencidos();

  // Regla 23: un organizador no puede inscribirse
  const esOrganizador = await prisma.organizador.findUnique({
    where: { gmail },
    select: { id_organizador: true },
  });
  if (esOrganizador) throw new AppError(403, 'Un organizador no puede inscribirse a un evento');

  for (let intento = 0; intento < MAX_REINTENTOS_CODIGO; intento += 1) {
    const codigo = generarCodigo();
    try {
      // eslint-disable-next-line no-await-in-loop
      return await prisma.$transaction(async (tx) => {
        // Regla 1: no inscribirse dos veces al mismo evento
        const duplicado = await tx.boleto.findUnique({
          where: { id_evento_gmail: { id_evento: idEvento, gmail } },
          select: { id_boleto: true },
        });
        if (duplicado) throw new AppError(409, 'Este correo ya está inscripto en este evento');

        // Reglas 5 y 14: restar un cupo solo si el evento está disponible y queda lugar
        const resultado = await tx.evento.updateMany({
          where: { id_evento: idEvento, estado: 'Disponible', cupo_disponible: { gt: 0 } },
          data: { cupo_disponible: { decrement: 1 } },
        });

        if (resultado.count === 0) {
          const evento = await tx.evento.findUnique({
            where: { id_evento: idEvento },
            select: { estado: true },
          });
          if (!evento) throw new AppError(404, 'El evento no existe');
          if (evento.estado === 'Finalizado') throw new AppError(409, 'El evento ya finalizó');
          throw new AppError(409, 'El evento está agotado: no quedan cupos disponibles');
        }

        const boleto = await tx.boleto.create({
          data: { id_evento: idEvento, nombre, gmail, codigo },
          select: { id_boleto: true, codigo: true, nombre: true, gmail: true },
        });

        const evento = await tx.evento.findUnique({
          where: { id_evento: idEvento },
          select: {
            id_evento: true,
            nombre_evento: true,
            fecha_evento: true,
            hora_inicio: true,
            hora_finalizacion: true,
            ubicacion: true,
            cupo_disponible: true,
          },
        });

        return { boleto, evento };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Si chocó el código aleatorio (rarísimo), se reintenta con otro código.
        if (String(err.meta?.target ?? '').includes('codigo')) continue;
        // Si no, fue una carrera con la misma pareja (evento, correo)
        throw new AppError(409, 'Este correo ya está inscripto en este evento');
      }
      throw err;
    }
  }
  throw new AppError(500, 'No se pudo generar un código único, intenta nuevamente');
};
