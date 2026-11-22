import { peticion } from './cliente.js';

export const organizadoresApi = {
  listar: () => peticion('/gestion/organizadores'),
  // Claves de registro: solo responden si quien consulta es administrador
  claves: () => peticion('/gestion/claves'),
  // Cantidad de cuentas de organizador sin autorizar (solo administrador)
  pendientes: () => peticion('/gestion/pendientes'),
  guardarClaves: (datos) => peticion('/gestion/claves', { metodo: 'PUT', cuerpo: datos }),
  impacto: (id) => peticion(`/gestion/organizadores/${id}/impacto`),
  editar: (id, datos) => peticion(`/gestion/organizadores/${id}`, { metodo: 'PUT', cuerpo: datos }),
  aprobacion: (id, aprobacion) =>
    peticion(`/gestion/organizadores/${id}/aprobacion`, { metodo: 'PATCH', cuerpo: { aprobacion } }),
  eliminar: (id) => peticion(`/gestion/organizadores/${id}`, { metodo: 'DELETE' }),
};
