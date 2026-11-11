// CONTROLADOR · eventos públicos (visitantes)
import { eventosApi } from '../models/api/eventosApi.js';
import { useCarga } from './useCarga.js';
import { useModal } from './ModalContext.jsx';

export function useEventosDisponibles() {
  const { version } = useModal();
  const c = useCarga(async () => (await eventosApi.disponibles()).eventos, [version]);
  return { eventos: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}

export function useEventosFinalizados() {
  const { version } = useModal();
  const c = useCarga(async () => (await eventosApi.finalizados()).eventos, [version]);
  return { eventos: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}
