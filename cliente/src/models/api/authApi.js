import { peticion } from './cliente.js';

export const authApi = {
  registro: (datos) => peticion('/auth/registro', { metodo: 'POST', cuerpo: datos }),
  // Un 401 aquí significa "credenciales incorrectas", no "sesión expirada"
  login: (datos) => peticion('/auth/login', { metodo: 'POST', cuerpo: datos, silenciarSesion: true }),
  logout: () => peticion('/auth/logout', { metodo: 'POST', silenciarSesion: true }),
  me: ({ silencioso = false } = {}) => peticion('/auth/me', { silenciarSesion: silencioso }),
  // Mi cuenta: edita los datos de la cuenta con sesión iniciada
  actualizarMiCuenta: (datos) => peticion('/auth/mi-cuenta', { metodo: 'PUT', cuerpo: datos }),
  // Recuperación de contraseña por enlace enviado al correo
  recuperar: (gmail) => peticion('/auth/recuperar', { metodo: 'POST', cuerpo: { gmail }, silenciarSesion: true }),
  restablecer: (token, contrasena) =>
    peticion('/auth/restablecer', { metodo: 'POST', cuerpo: { token, contrasena }, silenciarSesion: true }),
};
