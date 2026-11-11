// CONTROLADOR · hook genérico para acciones (enviar formularios, borrar, etc.)
import { useCallback, useState } from 'react';

export function useAccion() {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Devuelve { ok: true, datos } o { ok: false, error }
  const ejecutar = useCallback(async (fn) => {
    setCargando(true);
    setError('');
    try {
      return { ok: true, datos: await fn() };
    } catch (e) {
      setError(e.message);
      return { ok: false, error: e };
    } finally {
      setCargando(false);
    }
  }, []);

  return { ejecutar, cargando, error, setError };
}
