import { useAuth } from '../../controllers/AuthContext.jsx';
import { useInscripcion } from '../../controllers/useInscripcion.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';

// Regla 2: para inscribirse hace falta una cuenta. Ya no se piden datos: se toman de la cuenta.
export default function Inscripcion({ evento, onCerrar }) {
  const { usuario } = useAuth();
  const { abrirModal, refrescarDatos } = useModal();
  const { inscribirse, cargando, error } = useInscripcion();

  const confirmar = async () => {
    const r = await inscribirse(evento.id_evento);
    if (r.ok) {
      refrescarDatos();
      // El código se muestra una sola vez en la ventana siguiente
      abrirModal('codigo-boleto', { boleto: r.datos.boleto, evento: r.datos.evento });
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Inscripción a evento">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">
        Inscripción a
        <br />“{evento.nombre_evento}”
      </h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Confirma tus datos</p>

      <dl className="datos-cuenta">
        <div><dt>Nombre:</dt><dd>{usuario?.nombre}</dd></div>
        <div><dt>Gmail:</dt><dd>{usuario?.gmail}</dd></div>
        <div><dt>DNI:</dt><dd>{usuario?.dni}</dd></div>
        <div><dt>Teléfono:</dt><dd>{usuario?.numero_tel}</dd></div>
      </dl>
      <p className="modal__texto">Usaremos los datos de tu cuenta. Si algo está mal, pídele a un organizador que los corrija.</p>

      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        <button type="button" className="boton" onClick={confirmar} disabled={cargando}>
          {cargando ? 'Inscribiendo…' : 'Inscribirme'}
        </button>
        <button type="button" className="boton" onClick={onCerrar}>
          Descartar
        </button>
      </div>
    </ModalBase>
  );
}