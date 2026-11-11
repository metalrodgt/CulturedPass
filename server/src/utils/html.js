// Escapa texto antes de ponerlo dentro de un correo HTML (evita inyección HTML).
export const escaparHtml = (valor) =>
  String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
