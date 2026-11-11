import { peticion } from './cliente.js';

export const boletosApi = {
  // ----- público -----
  inscribirse: (idEvento, datos) =>
    peticion(`/eventos/${idEvento}/inscripciones`, { metodo: 'POST', cuerpo: datos }),
  cancelar: (codigo) => peticion('/boletos/cancelar', { metodo: 'POST', cuerpo: { codigo } }),

  // ----- gestión (asistencia) -----
  listarPorEvento: (idEvento) => peticion(`/gestion/eventos/${idEvento}/boletos`),
  marcarAsistencia: (idBoleto, estado) =>
    peticion(`/gestion/boletos/${idBoleto}/asistencia`, { metodo: 'PATCH', cuerpo: { estado } }),
};
