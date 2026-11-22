import { createHash, timingSafeEqual } from 'node:crypto';
import { prisma } from '../config/prisma.js';

// La clave de registro de organizadores vive en la tabla "configuracion" para que el administrador pueda cambiarla.
const NOMBRE_CLAVE = 'clave_organizador';

export const obtenerClaves = async () => {
  const fila = await prisma.configuracion.findUnique({ where: { nombre: NOMBRE_CLAVE } });
  return { clave_organizador: fila?.valor ?? null };
};

// Comparación en tiempo constante (no revela cuántos caracteres coinciden).
// Distingue mayúsculas de minúsculas, igual que una contraseña.
const iguales = (a, b) =>
  timingSafeEqual(createHash('sha256').update(String(a)).digest(), createHash('sha256').update(String(b)).digest());

export const claveOrganizadorValida = async (ingresada) => {
  const { clave_organizador } = await obtenerClaves();
  return clave_organizador !== null && iguales(ingresada, clave_organizador);
};

export const guardarClaves = async ({ clave_organizador }) => {
  await prisma.configuracion.upsert({
    where: { nombre: NOMBRE_CLAVE },
    update: { valor: clave_organizador },
    create: { nombre: NOMBRE_CLAVE, valor: clave_organizador },
  });
};
