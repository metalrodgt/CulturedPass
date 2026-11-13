// CONTROLADOR · eventos públicos (visitantes y organizadores)
import { useMemo, useState } from 'react';
import { eventosApi } from '../models/api/eventosApi.js';
import { normalizar } from '../models/formato.js';
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

export const FILTROS_DISPONIBILIDAD = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'disponibles', texto: 'Con cupo disponible' },
  { valor: 'agotados', texto: 'Sin cupo (agotados)' },
];

// Búsqueda de texto + filtro por disponibilidad de cupo
export function useFiltrosEventos(eventos, buscar) {
  const [disponibilidad, setDisponibilidad] = useState('todos');

  const filtrados = useMemo(() => {
    const t = normalizar(buscar.trim());
    return eventos.filter((e) => {
      if (disponibilidad === 'disponibles' && e.cupo_disponible <= 0) return false;
      if (disponibilidad === 'agotados' && e.cupo_disponible > 0) return false;
      if (!t) return true;
      return normalizar(`${e.nombre_evento} ${e.descripcion} ${e.nombre_encargado} ${e.ubicacion}`).includes(t);
    });
  }, [eventos, buscar, disponibilidad]);

  return { filtrados, disponibilidad, setDisponibilidad };
}
