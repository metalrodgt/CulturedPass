// MODELO · cliente HTTP base.
// Todas las llamadas al backend pasan por aquí.
const BASE = import.meta.env.VITE_API_URL ?? '/api';

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

export async function peticion(ruta, { metodo = 'GET', cuerpo, silenciarSesion = false } = {}) {
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
  return datos;
}
