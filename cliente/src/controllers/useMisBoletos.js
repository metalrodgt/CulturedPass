// CONTROLADOR · mis boletos (eventos en los que estoy inscripto)
import { useMemo, useState } from 'react';
import { boletosApi } from '../models/api/boletosApi.js';
import { fechaDeTimestamp, fechaLegible, normalizar } from '../models/formato.js';
import { useCarga } from './useCarga.js';
import { useModal } from './ModalContext.jsx';

export const FILTROS_ESTADO_BOLETO = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'Presente', texto: 'Presente' },
  { valor: 'Ausente', texto: 'Ausente' },
];

export function useMisBoletos() {
  const { version } = useModal();
  const c = useCarga(async () => (await boletosApi.misBoletos()).boletos, [version]);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');

  const boletos = c.datos ?? [];

  const visibles = useMemo(() => {
    const t = normalizar(busqueda.trim());
    return boletos.filter((b) => {
      if (estado !== 'todos' && b.estado !== estado) return false;
      if (!t) return true;
      const texto = normalizar(
        `${b.id_boleto} ${b.codigo} ${b.evento.nombre_evento} ${fechaDeTimestamp(b.fecha_creacion)} ${fechaLegible(b.evento.fecha_evento)}`,
      );
      return texto.includes(t);
    });
  }, [boletos, busqueda, estado]);

  return { boletos, visibles, cargando: c.cargando, error: c.error, busqueda, setBusqueda, estado, setEstado };
}
