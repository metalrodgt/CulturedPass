import 'dotenv/config';

const requerida = (nombre) => {
  const valor = process.env[nombre];
  if (!valor || !valor.trim()) {
    console.error(`❌ Falta la variable de entorno ${nombre} en server/.env`);
    process.exit(1);
  }
  return valor.trim();
};

const numero = (nombre, porDefecto) => {
  const n = Number(process.env[nombre] ?? porDefecto);
  return Number.isFinite(n) && n > 0 ? n : porDefecto;
};

requerida('DATABASE_URL');
const JWT_SECRET = requerida('JWT_SECRET');
if (JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET debe tener al menos 32 caracteres');
  process.exit(1);
}

// Clave que se exige SOLO para crear cuentas de organizador (la ve únicamente el administrador)
const CLAVE_REGISTRO = requerida('CLAVE_REGISTRO');

export const COOKIE_NAME = 'cp_token';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PRODUCCION: process.env.NODE_ENV === 'production',
  PORT: numero('PORT', 3000),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
  TIMEZONE: process.env.TIMEZONE ?? 'America/Argentina/Buenos_Aires',

  JWT_SECRET,
  JWT_HORAS: numero('JWT_HORAS', 8),

  CLAVE_REGISTRO,

  SMTP_HOST: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  SMTP_PORT: numero('SMTP_PORT', 465),
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  MAIL_FROM: process.env.MAIL_FROM ?? `CulturedPass <${process.env.SMTP_USER ?? 'no-reply@culturedpass.local'}>`,

  CANCEL_MAX_INTENTOS: numero('CANCEL_MAX_INTENTOS', 3),
  CANCEL_COOLDOWN_MINUTOS: numero('CANCEL_COOLDOWN_MINUTOS', 15),
};
