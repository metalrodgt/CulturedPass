import rateLimit from 'express-rate-limit';

const crear = (ventanaMs, limite, mensaje) =>
  rateLimit({
    windowMs: ventanaMs,
    limit: limite,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { mensaje },
  });

const MIN = 60 * 1000;

export const limiteGlobal = crear(15 * MIN, 600, 'Demasiadas peticiones, intenta más tarde');
export const limiteLogin = crear(15 * MIN, 10, 'Demasiados intentos de inicio de sesión, intenta en 15 minutos');
export const limiteRegistro = crear(60 * MIN, 5, 'Demasiados registros desde esta conexión, intenta más tarde');
// Mitigación parcial del spam de inscripciones (limitación conocida del proyecto)
export const limiteInscripcion = crear(10 * MIN, 10, 'Demasiadas inscripciones desde esta conexión, intenta más tarde');
