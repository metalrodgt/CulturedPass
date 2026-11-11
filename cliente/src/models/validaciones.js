// MODELO · validaciones de formularios (mismas reglas que el backend).
// Cada función devuelve un texto de error, o '' si el dato es válido.

const SIN_HTML = /[<>]/;

export const validarTexto = (valor, etiqueta, max = 200) => {
  const t = (valor ?? '').trim();
  if (!t) return `${etiqueta} es obligatorio`;
  if (t.length > max) return `${etiqueta} no puede superar los ${max} caracteres`;
  if (SIN_HTML.test(t)) return `${etiqueta} contiene caracteres no permitidos (< >)`;
  return '';
};

export const validarGmail = (valor) => {
  const t = (valor ?? '').trim();
  if (!t) return 'El correo es obligatorio';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) return 'El correo no es válido';
  return '';
};

export const validarTelefono = (valor) => {
  const t = (valor ?? '').trim();
  if (!t) return 'El teléfono es obligatorio';
  if (!/^[0-9+() -]{6,20}$/.test(t)) return 'Teléfono inválido (6 a 20 caracteres: números, + ( ) -)';
  return '';
};

export const validarContrasena = (valor, { obligatoria = true } = {}) => {
  if (!valor) return obligatoria ? 'La contraseña es obligatoria' : '';
  if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (valor.length > 72) return 'La contraseña no puede superar los 72 caracteres';
  return '';
};

export const validarUrl = (valor) => {
  const t = (valor ?? '').trim();
  if (!t) return 'La portada es obligatoria';
  if (!/^https?:\/\/\S+$/i.test(t) || SIN_HTML.test(t)) return 'La portada debe ser una URL válida (http:// o https://)';
  return '';
};

export const hayErrores = (errores) => Object.values(errores).some(Boolean);
