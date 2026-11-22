// CONTROLADOR · aviso de cuentas sin autorizar (solo para administradores)
import { useEffect, useState } from 'react';
import { organizadoresApi } from '../models/api/organizadoresApi.js';
import { useModal } from './ModalContext.jsx';

// Devuelve cuántas cuentas de organizador esperan autorización.
// Se actualiza al cambiar los datos (autorizar a alguien) y cada 60 segundos.
export function usePendientes(activo) {
  const { version } = useModal();
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    if (!activo) {
      setCantidad(0);
      return undefined;
    }
    let vivo = true;
    const cargar = () =>
      organizadoresApi
        .pendientes()
        .then((r) => vivo && setCantidad(r.organizadores))
        .catch(() => {});
    cargar();
    const t = setInterval(cargar, 60000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [activo, version]);

  return cantidad;
}
