import { useState } from 'react';
import { copiarTexto, fechaLegible } from '../../models/formato.js';
import ModalBase from './ModalBase.jsx';
import Icono from '../components/Icono.jsx';

// Ventana que muestra el código del boleto UNA sola vez (regla 18).
// No se puede cerrar con Esc ni haciendo clic afuera, para no perder el código por accidente.
export default function CodigoBoleto({ boleto, evento, onCerrar }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    setCopiado(await copiarTexto(boleto.codigo));
  };

  return (
    <ModalBase onCerrar={onCerrar} bloquear conLogo ancho="normal" etiqueta="Inscripción realizada">
      <h2 className="modal__titulo modal__titulo--chico">Inscripción realizada correctamente</h2>
      <p className="modal__texto">
        Te inscribiste a <strong>{evento.nombre_evento}</strong> el {fechaLegible(evento.fecha_evento)} a las{' '}
        {evento.hora_inicio}.
      </p>

      <p className="codigo__etiqueta">Tu código de boleto</p>
      <div className="codigo" aria-live="polite">{boleto.codigo}</div>
      <button type="button" className="boton boton--chico" onClick={copiar}>
        <Icono nombre={copiado ? 'check' : 'content_copy'} /> {copiado ? 'Copiado' : 'Copiar código'}
      </button>

      <p className="modal__advertencia">
        <Icono nombre="warning" />
        <span>
          Guarda este código ahora: <strong>no volverá a mostrarse</strong>. También lo enviamos a{' '}
          <strong>{boleto.gmail}</strong>. Lo necesitarás el día del evento o para cancelar tu inscripción.
        </span>
      </p>

      <div className="modal__acciones">
        <button type="button" className="boton" onClick={onCerrar}>
          Ya lo guardé
        </button>
      </div>
    </ModalBase>
  );
}
