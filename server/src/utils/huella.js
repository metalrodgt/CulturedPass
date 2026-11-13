import { createHmac } from 'node:crypto';
import { env } from '../config/env.js';

// "Huella" de los datos de acceso de una cuenta (nombre, correo, teléfono y contraseña).
// Se guarda dentro del JWT al iniciar sesión. Si alguien modifica esos datos, la huella
// cambia y la sesión anterior deja de ser válida: la cuenta debe volver a iniciar sesión.
export const calcularHuella = (o) =>
  createHmac('sha256', env.JWT_SECRET)
    .update([o.gmail, o.nombre, o.numero_tel, o.contrasena].join('\u0000'))
    .digest('hex')
    .slice(0, 32);
