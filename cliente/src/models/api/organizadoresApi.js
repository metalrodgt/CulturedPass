import { peticion } from './cliente.js';

export const organizadoresApi = {
  listar: () => peticion('/gestion/organizadores'),
  impacto: (id) => peticion(`/gestion/organizadores/${id}/impacto`),
  editar: (id, datos) => peticion(`/gestion/organizadores/${id}`, { metodo: 'PUT', cuerpo: datos }),
  aprobacion: (id, aprobacion) =>
    peticion(`/gestion/organizadores/${id}/aprobacion`, { metodo: 'PATCH', cuerpo: { aprobacion } }),
  eliminar: (id) => peticion(`/gestion/organizadores/${id}`, { metodo: 'DELETE' }),
};
