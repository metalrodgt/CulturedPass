import { boletosApi } from '../models/api/boletosApi.js';
import { useAccion } from './useAccion.js';

export function useInscripcion() {
  const { ejecutar, cargando, error } = useAccion();
  const inscribirse = (idEvento) => ejecutar(() => boletosApi.inscribirse(idEvento));
  return { inscribirse, cargando, error };
}
