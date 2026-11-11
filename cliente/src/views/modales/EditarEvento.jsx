import { useAccionesEvento } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import FormularioEvento from './FormularioEvento.jsx';

export default function EditarEvento({ evento, onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
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
    </ModalBase>
  );
}
