// CONTROLADOR · hook genérico para cargar datos desde la API.
import { useCallback, useEffect, useState } from 'react';

export function useCarga(cargador, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await cargador());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, dependencias);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, setDatos, cargando, error, recargar };
}
