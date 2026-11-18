import { Route, Routes } from 'react-router-dom';
import Layout from './views/layout/Layout.jsx';
import RutaProtegida from './views/layout/RutaProtegida.jsx';
import Inicio from './views/pages/Inicio.jsx';
import Eventos from './views/pages/Eventos.jsx';
import GestionEventos from './views/pages/GestionEventos.jsx';
import Asistencia from './views/pages/Asistencia.jsx';
import GestionCuentas from './views/pages/GestionCuentas.jsx';
import MisBoletos from './views/pages/MisBoletos.jsx';
import MiCuenta from './views/pages/MiCuenta.jsx';
import CambiarContrasena from './views/pages/CambiarContrasena.jsx';
import NoEncontrado from './views/pages/NoEncontrado.jsx';

// SPA: las rutas cambian la vista sin recargar la página
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="eventos" element={<Eventos />} />

        {/* Cualquier cuenta con sesión (visitante u organizador) */}
        <Route
          path="mis-boletos"
          element={
            <RutaProtegida>
              <MisBoletos />
            </RutaProtegida>
          }
        />
        <Route
          path="mi-cuenta"
          element={
            <RutaProtegida>
              <MiCuenta />
            </RutaProtegida>
          }
        />

        {/* Pública: se llega desde el enlace que se envía por correo */}
        <Route path="cambiar-contrasena" element={<CambiarContrasena />} />

        {/* Solo organizadores */}
        <Route
          path="gestion/eventos"
          element={
            <RutaProtegida rol="organizador">
              <GestionEventos />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/eventos/:id/asistencia"
          element={
            <RutaProtegida rol="organizador">
              <Asistencia />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/cuentas"
          element={
            <RutaProtegida rol="organizador">
              <GestionCuentas />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
