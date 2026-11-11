// CONTROLADOR · gestión de cuentas de organizadores
import { organizadoresApi } from '../models/api/organizadoresApi.js';
import { useCarga } from './useCarga.js';
import { useAccion } from './useAccion.js';
import { useModal } from './ModalContext.jsx';

export function useCuentas() {
  const { version } = useModal();
  const c = useCarga(async () => (await organizadoresApi.listar()).cuentas, [version]);
  return { cuentas: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}

export function useAccionesCuenta() {
  const { ejecutar, cargando, error, setError } = useAccion();
  return {
    cargando,
    error,
    setError,
    impacto: (id) => organizadoresApi.impacto(id),
    editar: (id, datos) => ejecutar(() => organizadoresApi.editar(id, datos)),
    aprobacion: (id, valor) => ejecutar(() => organizadoresApi.aprobacion(id, valor)),
    eliminar: (id) => ejecutar(() => organizadoresApi.eliminar(id)),
  };
}
