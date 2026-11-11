// CONTROLADOR · inscripción de un visitante a un evento
import { boletosApi } from '../models/api/boletosApi.js';
import { useAccion } from './useAccion.js';

export function useInscripcion() {
  const { ejecutar, cargando, error } = useAccion();
  const inscribirse = (idEvento, datos) => ejecutar(() => boletosApi.inscribirse(idEvento, datos));
  return { inscribirse, cargando, error };
}
