import { peticion } from './cliente.js';

export const eventosApi = {
  // ----- público (visitantes) -----
  disponibles: () => peticion('/eventos/disponibles'),
  finalizados: () => peticion('/eventos/finalizados'),
  obtener: (id) => peticion(`/eventos/${id}`),

  // ----- gestión (organizadores) -----
  gestionListar: () => peticion('/gestion/eventos'),
  crear: (datos) => peticion('/gestion/eventos', { metodo: 'POST', cuerpo: datos }),
  editar: (id, datos) => peticion(`/gestion/eventos/${id}`, { metodo: 'PUT', cuerpo: datos }),
  // Regla 27: cancelar un evento disponible (no se puede deshacer)
  cancelar: (id) => peticion(`/gestion/eventos/${id}/cancelar`, { metodo: 'PATCH' }),
  eliminar: (id) => peticion(`/gestion/eventos/${id}`, { metodo: 'DELETE' }),
};
