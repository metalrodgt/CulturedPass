import { Link } from 'react-router-dom';
import Panel from '../components/Panel.jsx';

export default function NoEncontrado() {
  return (
    <Panel titulo="Página no encontrada">
      <p className="mensaje">La página que buscas no existe.</p>
      <p className="panel__acciones">
        <Link to="/" className="boton">
          Volver al inicio
        </Link>
      </p>
    </Panel>
  );
}
