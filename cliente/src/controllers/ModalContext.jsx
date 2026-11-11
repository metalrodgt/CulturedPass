// CONTROLADOR · estado global de ventanas modales, avisos y refresco de datos.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ModalCtx = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null); // { nombre, props }
  const [aviso, setAviso] = useState(null); // { id, texto, tipo }
  const [version, setVersion] = useState(0);

  const abrirModal = useCallback((nombre, props = {}) => setModal({ nombre, props }), []);
  const cerrarModal = useCallback(() => setModal(null), []);
  const mostrarAviso = useCallback(
    (texto, tipo = 'ok') => setAviso({ id: Date.now(), texto, tipo }),
    [],
  );
  const ocultarAviso = useCallback(() => setAviso(null), []);
  // Las pantallas con listas se vuelven a cargar cuando cambia "version"
  const refrescarDatos = useCallback(() => setVersion((v) => v + 1), []);

  const valor = useMemo(
    () => ({ modal, aviso, version, abrirModal, cerrarModal, mostrarAviso, ocultarAviso, refrescarDatos }),
    [modal, aviso, version, abrirModal, cerrarModal, mostrarAviso, ocultarAviso, refrescarDatos],
  );

  return <ModalCtx.Provider value={valor}>{children}</ModalCtx.Provider>;
}

export const useModal = () => useContext(ModalCtx);
