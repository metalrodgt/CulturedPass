import { useAccionesEvento } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import Icono from '../components/Icono.jsx';

// Ventana de confirmación para cancelar un evento (regla 27). La cancelación no se puede deshacer.
export default function CancelarEvento({ evento, onCerrar }) {
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { cancelar, cargando, error } = useAccionesEvento();

  const confirmar = async () => {
    const r = await cancelar(evento.id_evento);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      const n = r.datos.notificados;
      mostrarAviso(
        n > 0
          ? `Evento cancelado correctamente. Se avisó por correo a ${n} inscripto(s).`
          : 'Evento cancelado correctamente',
      );
    }
  };

  // "Descartar" no cancela nada: vuelve a la ventana de editar evento
  const descartar = () => abrirModal('editar-evento', { evento });

  return (
    <ModalBase onCerrar={descartar} conLogo ancho="pequeno" etiqueta="Cancelar evento">
      <h2 className="modal__titulo modal__titulo--chico">¿Seguro que quieres cancelar este evento?</h2>
      <p className="modal__texto modal__texto--fuerte">Una vez cancelado no podrás deshacerlo</p>

      <div className="modal__advertencia">
        <Icono nombre="warning" />
        <span>
          <strong>“{evento.nombre_evento}”</strong> quedará como <strong>Cancelado</strong>: no se podrá editar, nadie podrá
          inscribirse y sus boletos ya no se podrán eliminar
          {evento.inscriptos > 0 ? (
            <>
              {' '}
              (hay <strong>{evento.inscriptos} inscripto(s)</strong> y se les avisará por correo)
            </>
          ) : (
            ' (todavía no tiene inscriptos)'
          )}
          .
        </span>
      </div>

      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        <button type="button" className="boton boton--rojo" onClick={confirmar} disabled={cargando}>
          {cargando ? 'Cancelando…' : 'Cancelar evento'}
        </button>
        <button type="button" className="boton" onClick={descartar} disabled={cargando}>
          Descartar
        </button>
      </div>
    </ModalBase>
  );
}
