// CONTROLADOR · gestión de cuentas (organizadores y visitantes)
import { useMemo, useState } from 'react';
import { organizadoresApi } from '../models/api/organizadoresApi.js';
import { visitantesApi } from '../models/api/visitantesApi.js';
import { normalizar } from '../models/formato.js';
import { useCarga } from './useCarga.js';
import { useAccion } from './useAccion.js';
import { useModal } from './ModalContext.jsx';

export const idDeCuenta = (c) => c.id_organizador ?? c.id_visitante;

const apiDe = (tipo) => (tipo === 'organizador' ? organizadoresApi : visitantesApi);

// tipo: 'organizador' | 'visitante'
export function useListaCuentas(tipo) {
  const { version } = useModal();
  const c = useCarga(async () => (await apiDe(tipo).listar()).cuentas, [tipo, version]);
  return { cuentas: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}

export const FILTROS_APROBACION = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'true', texto: 'True (autorizadas)' },
  { valor: 'false', texto: 'False (sin autorizar)' },
];

// Búsqueda por id, nombre, gmail o DNI + filtro por aprobación (true / false)
export function useFiltroCuentas(cuentas) {
  const [busqueda, setBusqueda] = useState('');
  const [aprobacion, setAprobacion] = useState('todas');

  const visibles = useMemo(() => {
    const t = normalizar(busqueda.trim());
    return cuentas.filter((c) => {
      if (aprobacion === 'true' && !c.aprobacion) return false;
      if (aprobacion === 'false' && c.aprobacion) return false;
      if (!t) return true;
      return (
        String(idDeCuenta(c)) === t ||
        normalizar(c.nombre).includes(t) ||
        normalizar(c.gmail).includes(t) ||
        (c.dni ?? '').includes(t)
      );
    });
  }, [cuentas, busqueda, aprobacion]);

  return { visibles, busqueda, setBusqueda, aprobacion, setAprobacion };
}

export function useAccionesCuenta(tipo = 'organizador') {
  const { ejecutar, cargando, error, setError } = useAccion();
  const api = apiDe(tipo);
  return {
    cargando,
    error,
    setError,
    impacto: (id) => organizadoresApi.impacto(id),
    editar: (id, datos) => ejecutar(() => api.editar(id, datos)),
    aprobacion: (id, valor) => ejecutar(() => api.aprobacion(id, valor)),
    eliminar: (id) => ejecutar(() => api.eliminar(id)),
  };
}