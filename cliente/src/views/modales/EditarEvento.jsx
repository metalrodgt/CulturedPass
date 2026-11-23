import { useAccionesEvento } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Icono from '../components/Icono.jsx';
import FormularioEvento from './FormularioEvento.jsx';

export default function EditarEvento({ evento, onCerrar }) {
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { editar, cargando, error } = useAccionesEvento();

  const guardar = async (datos) => {
    const r = await editar(evento.id_evento, datos);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      const n = r.datos.notificados;
      mostrarAviso(
        n > 0 ? `Evento editado correctamente. Se avisó por correo a ${n} inscripto(s).` : 'Evento editado correctamente',
      );
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} ancho="grande" etiqueta="Editar evento">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Editar evento</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Modificar datos</p>
      <FormularioEvento evento={evento} onEnviar={guardar} onCancelar={onCerrar} cargando={cargando} error={error} textoBoton="Guardar" />

      {/* Regla 27: cancelar el evento (abre una ventana de confirmación; no se puede deshacer) */}
      <div className="modal__peligro">
        <p>¿Este evento ya no se va a realizar?</p>
        <button type="button" className="boton boton--rojo" onClick={() => abrirModal('cancelar-evento', { evento })}>
          <Icono nombre="event_busy" /> Cancelar evento
        </button>
      </div>
    </ModalBase>
  );
}
