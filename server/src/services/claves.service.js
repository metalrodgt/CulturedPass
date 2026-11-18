import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../config/prisma.js';

// Las claves de registro viven en la tabla "configuracion" para que el administrador pueda cambiarlas.
const NOMBRE_ORG = 'clave_organizador';
const NOMBRE_VIS = 'clave_visitante';

export const obtenerClaves = async () => {
  const filas = await prisma.configuracion.findMany({ where: { nombre: { in: [NOMBRE_ORG, NOMBRE_VIS] } } });
  const mapa = Object.fromEntries(filas.map((f) => [f.nombre, f.valor]));
  return { clave_organizador: mapa[NOMBRE_ORG] ?? null, clave_visitante: mapa[NOMBRE_VIS] ?? null };
};

// Comparación en tiempo constante (no revela cuántos caracteres coinciden)
const iguales = (a, b) =>
  timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());

// Regla 2: la clave ingresada decide qué tipo de cuenta se crea. Devuelve 'organizador', 'visitante' o null.
export const rolPorClave = async (ingresada) => {
  const c = await obtenerClaves();
  const esOrganizador = c.clave_organizador !== null && iguales(ingresada, c.clave_organizador);
  const esVisitante = c.clave_visitante !== null && iguales(ingresada, c.clave_visitante);
  if (esOrganizador) return 'organizador';
  if (esVisitante) return 'visitante';
  return null;
};

export const guardarClaves = async ({ clave_organizador, clave_visitante }) => {
  await prisma.$transaction([
    prisma.configuracion.upsert({
      where: { nombre: NOMBRE_ORG },
      update: { valor: clave_organizador },
      create: { nombre: NOMBRE_ORG, valor: clave_organizador },
    }),
    prisma.configuracion.upsert({
      where: { nombre: NOMBRE_VIS },
      update: { valor: clave_visitante },
      create: { nombre: NOMBRE_VIS, valor: clave_visitante },
    }),
  ]);
};
