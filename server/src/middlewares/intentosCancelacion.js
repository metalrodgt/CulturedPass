import { env } from '../config/env.js';

// Control de intentos fallidos al cancelar (3 intentos y luego cooldown).
// Como no hay cuentas de visitantes, se controla por IP.
// Vive en memoria: se reinicia si se reinicia el servidor (suficiente para esta etapa).
const MAX = env.CANCEL_MAX_INTENTOS;
const COOLDOWN_MS = env.CANCEL_COOLDOWN_MINUTOS * 60 * 1000;
const registro = new Map(); // ip -> { intentos, bloqueadoHasta }

export const segundosDeBloqueo = (ip) => {
  const r = registro.get(ip);
  if (!r || !r.bloqueadoHasta) return 0;
  const restante = r.bloqueadoHasta - Date.now();
  if (restante <= 0) {
    registro.delete(ip);
    return 0;
  }
  return Math.ceil(restante / 1000);
};

export const registrarFallo = (ip) => {
  const r = registro.get(ip) ?? { intentos: 0, bloqueadoHasta: 0 };
  r.intentos += 1;
  if (r.intentos >= MAX) {
    r.intentos = 0;
    r.bloqueadoHasta = Date.now() + COOLDOWN_MS;
    registro.set(ip, r);
    return { bloqueado: true, segundosRestantes: Math.ceil(COOLDOWN_MS / 1000), intentosRestantes: 0 };
  }
  registro.set(ip, r);
  return { bloqueado: false, segundosRestantes: 0, intentosRestantes: MAX - r.intentos };
};

export const limpiarIntentos = (ip) => registro.delete(ip);

// Limpieza periódica: elimina bloqueos ya vencidos
setInterval(() => {
  const ahora = Date.now();
  for (const [ip, r] of registro) {
    if (r.bloqueadoHasta && r.bloqueadoHasta <= ahora) registro.delete(ip);
  }
}, 10 * 60 * 1000).unref();
