import { env } from '../config/env.js';

// Fecha de hoy (AAAA-MM-DD) en la zona horaria configurada.
export const hoyEnZona = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: env.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

// Texto -> valores que Prisma guarda en columnas DATE y TIME
export const aFechaDB = (texto) => new Date(`${texto}T00:00:00.000Z`);
export const aHoraDB = (texto) => new Date(`1970-01-01T${texto}:00.000Z`);

// Valores de Prisma -> texto para el cliente
export const fechaATexto = (d) => d.toISOString().slice(0, 10); // AAAA-MM-DD
export const horaATexto = (d) => d.toISOString().slice(11, 16); // HH:MM

export const fechaLegible = (texto) => texto.split('-').reverse().join('/'); // DD/MM/AAAA

// '2026-11-17' -> '2026-11-18' (devuelve '' si la fecha no es válida)
export const diaSiguiente = (texto) => {
  const d = new Date(`${texto}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
