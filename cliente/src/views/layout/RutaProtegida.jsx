import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useModal } from '../../controllers/ModalContext.jsx';

// Regla 3: solo el organizador accede a la gestión de eventos y cuentas
export default function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth();
  const { abrirModal } = useModal();

  useEffect(() => {
    if (!cargando && !usuario) abrirModal('login');
  }, [cargando, usuario, abrirModal]);

  if (cargando) return <p className="cargando">Cargando…</p>;
  if (!usuario) return <Navigate to="/" replace />;
  return children;
}
