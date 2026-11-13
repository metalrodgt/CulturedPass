import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

// Pasa a "Finalizado" los eventos cuya fecha + hora de finalización ya pasó
// (comparado en la zona horaria configurada). Regla 7.
export const finalizarEventosVencidos = async () => {
  await prisma.$executeRaw`
    UPDATE evento
       SET estado = 'Finalizado'::estado_evento
     WHERE estado = 'Disponible'::estado_evento
       AND (COALESCE(fecha_final, fecha_evento) + hora_finalizacion) < (now() AT TIME ZONE ${env.TIMEZONE}::text)`;
};

export const programarFinalizacionAutomatica = () => {
  setInterval(() => {
    finalizarEventosVencidos().catch((e) => console.error('Error al finalizar eventos:', e.message));
  }, 60 * 1000).unref();
};
