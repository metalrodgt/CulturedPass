import { PrismaClient } from '@prisma/client';

const base = new PrismaClient({ log: ['warn', 'error'] });

// ---------------------------------------------------------------------------
// Reintentos automáticos ante errores TRANSITORIOS de conexión con la base.
//
// El pooler de Supabase (pgbouncer) cierra o recicla conexiones, sobre todo después de un rato
// sin uso. Cuando Prisma justo usa una conexión caída, falla UNA vez y la siguiente consulta
// funciona. Esa es la causa típica de errores 500 "intermitentes que se arreglan reintentando".
// Acá se reintenta solo, hasta 3 veces, con una pequeña espera, y el usuario ni se entera.
//
// Seguridad de los reintentos:
//  - Errores donde la consulta NO llegó a ejecutarse (no se pudo conectar, pool lleno, "prepared
//    statement"): se reintenta siempre (lecturas y escrituras).
//  - Errores donde la conexión se cortó a mitad de camino: solo se reintentan LECTURAS, porque en
//    una escritura no se puede saber si llegó a ejecutarse (evita duplicar datos).
// ---------------------------------------------------------------------------
const CODIGOS_SIN_EJECUTAR = new Set(['P1001', 'P2024']); // no alcanzó el servidor / no hubo conexión libre
const CODIGOS_DE_CORTE = new Set(['P1002', 'P1008', 'P1017']); // se cortó o tardó demasiado
const TEXTO_SIN_EJECUTAR = /prepared statement|bind message|42P05|26000/i;
const TEXTO_DE_CORTE = /Connection terminated|Server has closed the connection|ECONNRESET|Connection reset/i;
const LECTURAS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  '$queryRaw',
]);

const MAX_INTENTOS = 3;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sePuedeReintentar = (operation, err) => {
  const mensaje = err?.message ?? '';
  if (CODIGOS_SIN_EJECUTAR.has(err?.code) || TEXTO_SIN_EJECUTAR.test(mensaje)) return true;
  if (CODIGOS_DE_CORTE.has(err?.code) || TEXTO_DE_CORTE.test(mensaje)) return LECTURAS.has(operation);
  return false;
};

// Una única instancia compartida en todo el servidor.
// Prisma usa consultas parametrizadas: protege contra inyección SQL.
export const prisma = base.$extends({
  name: 'reintentos-de-conexion',
  query: {
    async $allOperations({ operation, args, query }) {
      for (let intento = 1; ; intento += 1) {
        try {
          return await query(args);
        } catch (err) {
          if (intento >= MAX_INTENTOS || !sePuedeReintentar(operation, err)) throw err;
          console.warn(
            `⚠️  Error transitorio de la base (${err.code ?? 'sin código'}). Reintento ${intento}/${MAX_INTENTOS - 1}…`,
          );
          await esperar(250 * intento);
        }
      }
    },
  },
});
