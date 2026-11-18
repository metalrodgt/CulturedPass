import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useModal } from '../../controllers/ModalContext.jsx';

// Exige sesión iniciada. Con rol="organizador" además exige que sea organizador
// (los visitantes no tienen acceso a la gestión).
export default function RutaProtegida({ children, rol }) {
  const { usuario, cargando } = useAuth();
  const { abrirModal } = useModal();

  useEffect(() => {
    if (!cargando && !usuario) abrirModal('login');
  }, [cargando, usuario, abrirModal]);

  if (cargando) return <p className="cargando">Cargando…</p>;
  if (!usuario || (rol && usuario.rol !== rol)) return <Navigate to="/" replace />;
  return children;
}
