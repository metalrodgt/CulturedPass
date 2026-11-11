import { fechaATexto, horaATexto } from './fechas.js';

// Convierte los Date de Prisma (DATE / TIME) a texto legible por el frontend.
export const serializarEvento = (e) => {
  const salida = { ...e };
  if (e.fecha_evento instanceof Date) salida.fecha_evento = fechaATexto(e.fecha_evento);
  if (e.hora_inicio instanceof Date) salida.hora_inicio = horaATexto(e.hora_inicio);
  if (e.hora_finalizacion instanceof Date) salida.hora_finalizacion = horaATexto(e.hora_finalizacion);
  return salida;
};
