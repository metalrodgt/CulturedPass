// CONTROLADOR · gestión de eventos (organizador)
import { eventosApi } from '../models/api/eventosApi.js';
import { useCarga } from './useCarga.js';
import { useAccion } from './useAccion.js';
import { useModal } from './ModalContext.jsx';

export function useGestionEventos() {
  const { version } = useModal();
  const c = useCarga(async () => (await eventosApi.gestionListar()).eventos, [version]);
  return { eventos: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}

export function useAccionesEvento() {
  const { ejecutar, cargando, error, setError } = useAccion();
  return {
    cargando,
    error,
    setError,
    crear: (datos) => ejecutar(() => eventosApi.crear(datos)),
    editar: (id, datos) => ejecutar(() => eventosApi.editar(id, datos)),
    eliminar: (id) => ejecutar(() => eventosApi.eliminar(id)),
  };
}
