import { useModal } from '../../controllers/ModalContext.jsx';
import DetalleEvento from './DetalleEvento.jsx';
import Inscripcion from './Inscripcion.jsx';
import CodigoBoleto from './CodigoBoleto.jsx';
import CancelarInscripcion from './CancelarInscripcion.jsx';
import Login from './Login.jsx';
import Registro from './Registro.jsx';
import CuentaNoAprobada from './CuentaNoAprobada.jsx';
import CrearEvento from './CrearEvento.jsx';
import EditarEvento from './EditarEvento.jsx';
import EliminarEvento from './EliminarEvento.jsx';
import EditarCuenta from './EditarCuenta.jsx';
import EliminarCuenta from './EliminarCuenta.jsx';
import ClaveRegistro from './ClaveRegistro.jsx';

// Nombre usado en abrirModal('nombre', props) -> componente
const MODALES = {
  'detalle-evento': DetalleEvento,
  inscripcion: Inscripcion,
  'codigo-boleto': CodigoBoleto,
  cancelar: CancelarInscripcion,
  login: Login,
  registro: Registro,
  'cuenta-no-aprobada': CuentaNoAprobada,
  'crear-evento': CrearEvento,
  'editar-evento': EditarEvento,
  'eliminar-evento': EliminarEvento,
  'editar-cuenta': EditarCuenta,
  'eliminar-cuenta': EliminarCuenta,
  'clave-registro': ClaveRegistro,
};

export default function ModalHost() {
  const { modal, cerrarModal } = useModal();
  if (!modal) return null;
  const Componente = MODALES[modal.nombre];
  return Componente ? <Componente {...modal.props} onCerrar={cerrarModal} /> : null;
}
