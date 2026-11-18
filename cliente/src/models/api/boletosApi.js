import { peticion } from './cliente.js';

export const boletosApi = {
  // ----- público -----
  // Los datos de la persona salen de su cuenta (sesión iniciada): no se envía ningún dato
  inscribirse: (idEvento) => peticion(`/eventos/${idEvento}/inscripciones`, { metodo: 'POST' }),
  // Mis boletos: los boletos de los eventos en los que estoy inscripto
  misBoletos: () => peticion('/mis-boletos'),
  cancelar: (codigo) => peticion('/boletos/cancelar', { metodo: 'POST', cuerpo: { codigo } }),

  // ----- gestión (asistencia) -----
  listarPorEvento: (idEvento) => peticion(`/gestion/eventos/${idEvento}/boletos`),
  marcarAsistencia: (idBoleto, estado) =>
    peticion(`/gestion/boletos/${idBoleto}/asistencia`, { metodo: 'PATCH', cuerpo: { estado } }),
};
