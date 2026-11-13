// CONTROLADOR · gestión de cuentas de organizadores
import { useMemo, useState } from 'react';
import { organizadoresApi } from '../models/api/organizadoresApi.js';
import { normalizar } from '../models/formato.js';
import { useCarga } from './useCarga.js';
import { useAccion } from './useAccion.js';
import { useModal } from './ModalContext.jsx';

export function useCuentas() {
  const { version } = useModal();
  const c = useCarga(async () => (await organizadoresApi.listar()).cuentas, [version]);
  return { cuentas: c.datos ?? [], cargando: c.cargando, error: c.error, recargar: c.recargar };
}

export const FILTROS_APROBACION = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'true', texto: 'True (aprobadas)' },
  { valor: 'false', texto: 'False (sin aprobar)' },
];

// Búsqueda por id, nombre o gmail + filtro por aprobación (true / false)
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
        String(c.id_organizador) === t ||
        normalizar(c.nombre).includes(t) ||
        normalizar(c.gmail).includes(t)
      );
    });
  }, [cuentas, busqueda, aprobacion]);

  return { visibles, busqueda, setBusqueda, aprobacion, setAprobacion };
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
