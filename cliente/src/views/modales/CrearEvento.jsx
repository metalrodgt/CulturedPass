import { useAccionesEvento } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import FormularioEvento from './FormularioEvento.jsx';

export default function CrearEvento({ onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { crear, cargando, error } = useAccionesEvento();

  const guardar = async (datos) => {
    const r = await crear(datos);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Evento creado correctamente');
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} ancho="grande" etiqueta="Creación de evento">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Creación de evento</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Rellenar datos</p>
      <FormularioEvento onEnviar={guardar} onCancelar={onCerrar} cargando={cargando} error={error} textoBoton="Crear" />
    </ModalBase>
  );
}
