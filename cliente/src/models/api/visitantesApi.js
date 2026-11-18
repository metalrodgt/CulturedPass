import { peticion } from './cliente.js';

export const visitantesApi = {
  listar: () => peticion('/gestion/visitantes'),
  editar: (id, datos) => peticion(`/gestion/visitantes/${id}`, { metodo: 'PUT', cuerpo: datos }),
  aprobacion: (id, aprobacion) =>
    peticion(`/gestion/visitantes/${id}/aprobacion`, { metodo: 'PATCH', cuerpo: { aprobacion } }),
  eliminar: (id) => peticion(`/gestion/visitantes/${id}`, { metodo: 'DELETE' }),
};