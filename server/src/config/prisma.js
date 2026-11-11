import { PrismaClient } from '@prisma/client';

// Una única instancia compartida en todo el servidor.
// Prisma usa consultas parametrizadas: protege contra inyección SQL.
export const prisma = new PrismaClient({ log: ['warn', 'error'] });
