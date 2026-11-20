// MODELO · cliente HTTP base.
// Todas las llamadas al backend pasan por aquí.
const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, mensaje, datos = {}) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}

// El contexto de sesión registra aquí qué hacer cuando el servidor responde 401
let manejadorSesionExpirada = null;
export const registrarManejadorSesion = (fn) => {
  manejadorSesionExpirada = fn;
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Un único intento de petición
async function intentar(ruta, { metodo, cuerpo, silenciarSesion }) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      credentials: 'include', // envía la cookie de sesión (JWT httpOnly)
      headers: cuerpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verifica que el backend esté encendido.');
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !silenciarSesion && manejadorSesionExpirada) {
      manejadorSesionExpirada();
    }
    throw new ApiError(respuesta.status, datos?.mensaje ?? 'Ocurrió un error inesperado', datos ?? {});
  }

  // Respuesta "ok" que no es JSON (por ejemplo, la página del frontend por una mala configuración del proxy)
  if (datos === null) {
    throw new ApiError(502, 'El servidor devolvió una respuesta inesperada. Revisa la conexión con el backend.');
  }
  return datos;
}

// Las lecturas (GET) se reintentan solas hasta 2 veces si el servidor no responde o devuelve un error 5xx
// (por ejemplo, un corte momentáneo de la base). Las escrituras (POST, PUT...) NO se reintentan
// automáticamente para no duplicar operaciones.
const REINTENTOS_GET = 2;

export async function peticion(ruta, { metodo = 'GET', cuerpo, silenciarSesion = false } = {}) {
  const maxIntentos = metodo === 'GET' ? REINTENTOS_GET + 1 : 1;

  for (let intento = 1; ; intento += 1) {
    try {
      return await intentar(ruta, { metodo, cuerpo, silenciarSesion });
    } catch (err) {
      const transitorio = err instanceof ApiError && (err.status === 0 || err.status >= 500);
      if (!transitorio || intento >= maxIntentos) throw err;
      await esperar(500 * intento);
    }
  }
}
