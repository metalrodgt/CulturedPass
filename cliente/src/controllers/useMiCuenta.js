// CONTROLADOR · editar los datos de mi propia cuenta
import { authApi } from '../models/api/authApi.js';
import { useAccion } from './useAccion.js';

export function useMiCuenta() {
  const { ejecutar, cargando, error } = useAccion();
  const actualizar = (datos) => ejecutar(() => authApi.actualizarMiCuenta(datos));
  return { actualizar, cargando, error };
}
