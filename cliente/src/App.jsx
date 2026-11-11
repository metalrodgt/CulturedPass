import { Route, Routes } from 'react-router-dom';
import Layout from './views/layout/Layout.jsx';
import RutaProtegida from './views/layout/RutaProtegida.jsx';
import Inicio from './views/pages/Inicio.jsx';
import Eventos from './views/pages/Eventos.jsx';
import GestionEventos from './views/pages/GestionEventos.jsx';
import Asistencia from './views/pages/Asistencia.jsx';
import GestionCuentas from './views/pages/GestionCuentas.jsx';
import NoEncontrado from './views/pages/NoEncontrado.jsx';

// SPA: las rutas cambian la vista sin recargar la página
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="eventos" element={<Eventos />} />
        <Route
          path="gestion/eventos"
          element={
            <RutaProtegida>
              <GestionEventos />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/eventos/:id/asistencia"
          element={
            <RutaProtegida>
              <Asistencia />
            </RutaProtegida>
          }
        />
        <Route
          path="gestion/cuentas"
          element={
            <RutaProtegida>
              <GestionCuentas />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
