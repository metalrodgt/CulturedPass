// CONTROLADOR · lista de asistencia de un evento
import { useMemo, useState } from 'react';
import { boletosApi } from '../models/api/boletosApi.js';
import { fechaDeTimestamp, normalizar } from '../models/formato.js';
import { useCarga } from './useCarga.js';
import { useModal } from './ModalContext.jsx';

export function useAsistencia(idEvento) {
  const { mostrarAviso } = useModal();
  const c = useCarga(() => boletosApi.listarPorEvento(idEvento), [idEvento]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos'); // 'Todos' | 'Presente' | 'Ausente'
  const [procesando, setProcesando] = useState(null);

  const boletos = c.datos?.boletos ?? [];

  const visibles = useMemo(() => {
    const t = normalizar(busqueda.trim());
    return boletos.filter((b) => {
      if (filtro !== 'Todos' && b.estado !== filtro) return false;
      if (!t) return true;
      const texto = normalizar(`${b.id_boleto} ${b.codigo} ${b.nombre} ${b.gmail} ${fechaDeTimestamp(b.fecha_creacion)}`);
      return texto.includes(t);
    });
  }, [boletos, busqueda, filtro]);

  // Botón "estado": Ausente <-> Presente
  const cambiarEstado = async (boleto) => {
    const nuevo = boleto.estado === 'Presente' ? 'Ausente' : 'Presente';
    setProcesando(boleto.id_boleto);
    try {
      const r = await boletosApi.marcarAsistencia(boleto.id_boleto, nuevo);
      c.setDatos((d) => ({
        ...d,
        boletos: d.boletos.map((b) => (b.id_boleto === boleto.id_boleto ? r.boleto : b)),
        resumen: { ...d.resumen, presentes: d.resumen.presentes + (nuevo === 'Presente' ? 1 : -1) },
      }));
    } catch (e) {
      mostrarAviso(e.message, 'error');
    } finally {
      setProcesando(null);
    }
  };

  return {
    evento: c.datos?.evento ?? null,
    resumen: c.datos?.resumen ?? { total: 0, presentes: 0 },
    visibles,
    cargando: c.cargando,
    error: c.error,
    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    procesando,
    cambiarEstado,
  };
}
