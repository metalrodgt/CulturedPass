import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const crear = (ventanaMs, limite, mensaje, opciones = {}) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { mensaje },
    ...opciones,
  });

const MIN = 60 * 1000;

// En desarrollo (tu computadora, NODE_ENV=development) los límites son mucho más altos para poder
// probar sin bloqueos. En producción (Render, NODE_ENV=production) se usan los estrictos.
const segunEntorno = (produccion, desarrollo) => (env.PRODUCCION ? produccion : desarrollo);

export const limiteGlobal = crear(15 * MIN, segunEntorno(600, 5000), 'Demasiadas peticiones, intenta más tarde');

// Login: SOLO cuentan los intentos fallidos (los inicios de sesión correctos no gastan el límite)
export const limiteLogin = crear(
  15 * MIN,
  segunEntorno(20, 500),
  'Demasiados intentos fallidos de inicio de sesión, intenta en 15 minutos',
  { skipSuccessfulRequests: true },
);

export const limiteRegistro = crear(60 * MIN, segunEntorno(5, 200), 'Demasiados registros desde esta conexión, intenta más tarde');
// Mitigación parcial del spam de inscripciones (limitación conocida del proyecto)
export const limiteInscripcion = crear(10 * MIN, segunEntorno(10, 200), 'Demasiadas inscripciones desde esta conexión, intenta más tarde');
export const limiteRecuperacion = crear(60 * MIN, segunEntorno(5, 100), 'Demasiadas solicitudes de recuperación, intenta más tarde');
