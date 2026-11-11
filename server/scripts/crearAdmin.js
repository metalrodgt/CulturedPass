// Crea (o actualiza) el primer administrador, ya aprobado.
// Es necesario porque las cuentas nuevas nacen sin aprobar y alguien debe aprobarlas.
// Uso: completar ADMIN_* en .env y ejecutar: npm run crear-admin
import bcrypt from 'bcryptjs';
import '../src/config/env.js';
import { prisma } from '../src/config/prisma.js';
import { registroSchema } from '../src/validators/schemas.js';

const entrada = registroSchema.safeParse({
  nombre: process.env.ADMIN_NOMBRE,
  gmail: process.env.ADMIN_GMAIL,
  numero_tel: process.env.ADMIN_TEL,
  contrasena: process.env.ADMIN_PASSWORD,
});

if (!entrada.success) {
  console.error('❌ Revisa las variables ADMIN_* del .env:');
  entrada.error.issues.forEach((i) => console.error(` - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

const { nombre, gmail, numero_tel, contrasena } = entrada.data;
const hash = await bcrypt.hash(contrasena, 12);

await prisma.organizador.upsert({
  where: { gmail },
  update: { nombre, numero_tel, contrasena: hash, aprobacion: true, administrador: true },
  create: { nombre, gmail, numero_tel, contrasena: hash, aprobacion: true, administrador: true },
});

console.log(`✅ Administrador listo: ${gmail}`);
console.log('   Ahora borra ADMIN_PASSWORD del archivo .env.');
await prisma.$disconnect();
