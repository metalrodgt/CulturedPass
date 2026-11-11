import { useAccionesEvento } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import Icono from '../components/Icono.jsx';

export default function EliminarEvento({ evento, onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { eliminar, cargando, error } = useAccionesEvento();

  const confirmar = async () => {
    const r = await eliminar(evento.id_evento);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Evento eliminado correctamente');
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} conLogo ancho="pequeno" etiqueta="Eliminar evento">
      <h2 className="modal__titulo modal__titulo--chico">¿Seguro que quieres eliminar este evento?</h2>
      <p className="modal__texto modal__texto--fuerte">No podrás deshacerlo</p>

      {/* Advertencia de borrado en cascada: se explica todo lo que se pierde */}
      <div className="modal__advertencia">
        <Icono nombre="warning" />
        <span>
          Se eliminará <strong>“{evento.nombre_evento}”</strong>
          {evento.inscriptos > 0 ? (
            <>
              {' '}
              junto con sus <strong>{evento.inscriptos} boleto(s)</strong> e inscripciones. Los inscriptos no recibirán aviso.
            </>
          ) : (
            '. No tiene inscripciones.'
          )}
        </span>
      </div>

      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        <button type="button" className="boton" onClick={onCerrar}>
          Descartar
        </button>
        <button type="button" className="boton boton--rojo" onClick={confirmar} disabled={cargando}>
          {cargando ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </ModalBase>
  );
}
