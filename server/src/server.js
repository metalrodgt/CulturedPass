import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { finalizarEventosVencidos, programarFinalizacionAutomatica } from './services/evento.service.js';

try {
  await prisma.$connect();
  await finalizarEventosVencidos();
} catch (err) {
  console.error('❌ No se pudo conectar a la base de datos. Revisa DATABASE_URL en server/.env');
  console.error(err.message);
  process.exit(1);
}

programarFinalizacionAutomatica();

const servidor = app.listen(env.PORT, () => {
  console.log(`✅ CulturedPass API lista en http://localhost:${env.PORT}/api/salud`);
});

const cerrar = async () => {
  console.log('\nCerrando servidor...');
  servidor.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
