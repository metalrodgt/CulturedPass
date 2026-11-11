// CONTROLADOR · cancelación de inscripción (3 intentos y luego cooldown, definido por el servidor)
import { useEffect, useState } from 'react';
import { boletosApi } from '../models/api/boletosApi.js';
import { useAccion } from './useAccion.js';

// Se guarda a nivel de módulo para que el bloqueo siga visible si se cierra y reabre la ventana
let bloqueadoHasta = 0;
const segundosRestantes = () => Math.max(0, Math.ceil((bloqueadoHasta - Date.now()) / 1000));

export function useCancelacion() {
  const { ejecutar, cargando, error } = useAccion();
  const [intentosRestantes, setIntentosRestantes] = useState(null);
  const [restante, setRestante] = useState(segundosRestantes);
  const hayBloqueo = restante > 0;

  useEffect(() => {
    if (!hayBloqueo) return undefined;
    const t = setInterval(() => {
      const s = segundosRestantes();
      setRestante(s);
      if (s === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [hayBloqueo]);

  const cancelar = async (codigo) => {
    const r = await ejecutar(() => boletosApi.cancelar(codigo));
    if (r.ok) return true;
    const e = r.error;
    if (e.status === 429 && e.datos?.segundosRestantes) {
      bloqueadoHasta = Date.now() + e.datos.segundosRestantes * 1000;
      setRestante(e.datos.segundosRestantes);
    }
    if (e.status === 404 && typeof e.datos?.intentosRestantes === 'number') {
      setIntentosRestantes(e.datos.intentosRestantes);
    }
    return false;
  };

  return { cancelar, cargando, error, intentosRestantes, segundosRestantes: restante, bloqueado: hayBloqueo };
}
