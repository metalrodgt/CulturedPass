// CONTROLADOR · sesión del organizador.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '../models/api/authApi.js';
import { registrarManejadorSesion } from '../models/api/cliente.js';
import { useModal } from './ModalContext.jsx';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const { mostrarAviso } = useModal();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const usuarioRef = useRef(null);
  usuarioRef.current = usuario;

  // Si el servidor responde 401 estando logueado (sesión vencida o cuenta deshabilitada)
  useEffect(() => {
    registrarManejadorSesion(() => {
      if (usuarioRef.current) {
        setUsuario(null);
        mostrarAviso('Tu sesión fue cerrada. Inicia sesión nuevamente.', 'error');
      }
    });
  }, [mostrarAviso]);

  // Al abrir la página: ¿ya hay una sesión activa?
  useEffect(() => {
    let activo = true;
    authApi
      .me({ silencioso: true })
      .then((r) => activo && setUsuario(r.usuario))
      .catch(() => activo && setUsuario(null))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // Mientras hay sesión, se verifica cada 30 s que la cuenta siga habilitada
  const idUsuario = usuario?.id_organizador;
  useEffect(() => {
    if (!idUsuario) return undefined;
    const t = setInterval(() => {
      authApi.me().catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [idUsuario]);

  const iniciarSesion = useCallback(async (gmail, contrasena) => {
    const r = await authApi.login({ gmail, contrasena });
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* si falla, igual se limpia la sesión local */
    }
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion }),
    [usuario, cargando, iniciarSesion, cerrarSesion],
  );
  return <AuthCtx.Provider value={valor}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
