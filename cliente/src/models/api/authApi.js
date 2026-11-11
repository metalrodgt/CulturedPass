import { peticion } from './cliente.js';

export const authApi = {
  registro: (datos) => peticion('/auth/registro', { metodo: 'POST', cuerpo: datos }),
  // Un 401 aquí significa "credenciales incorrectas", no "sesión expirada"
  login: (datos) => peticion('/auth/login', { metodo: 'POST', cuerpo: datos, silenciarSesion: true }),
  logout: () => peticion('/auth/logout', { metodo: 'POST', silenciarSesion: true }),
  me: ({ silencioso = false } = {}) => peticion('/auth/me', { silenciarSesion: silencioso }),
};
