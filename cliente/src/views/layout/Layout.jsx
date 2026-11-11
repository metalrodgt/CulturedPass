import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import ModalHost from '../modales/ModalHost.jsx';
import Aviso from '../components/Aviso.jsx';

export default function Layout() {
  const { pathname } = useLocation();

  // Al cambiar de pantalla se vuelve arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main className="contenido">
        <Outlet />
      </main>
      <ModalHost />
      <Aviso />
    </>
  );
}
