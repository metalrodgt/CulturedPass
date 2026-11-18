// CONTROLADOR · claves de registro (solo administrador)
import { organizadoresApi } from '../models/api/organizadoresApi.js';
import { useCarga } from './useCarga.js';
import { useAccion } from './useAccion.js';

export function useClaves() {
  const c = useCarga(() => organizadoresApi.claves(), []);
  const { ejecutar, cargando: guardando, error: errorGuardar } = useAccion();
  const guardar = (datos) => ejecutar(() => organizadoresApi.guardarClaves(datos));
  return {
    claves: c.datos,
    cargando: c.cargando,
    error: c.error,
    recargar: c.recargar,
    guardar,
    guardando,
    errorGuardar,
  };
}