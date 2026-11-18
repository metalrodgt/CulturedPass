import { useNavigate } from 'react-router-dom';
import ModalBase from './ModalBase.jsx';

// Reemplaza a la ventana que mostraba el código del boleto: ahora el boleto se ve en "Mis boletos"
export default function InscripcionExitosa({ evento, onCerrar }) {
  const navigate = useNavigate();

  const verMisBoletos = () => {
    onCerrar();
    navigate('/mis-boletos');
  };

  return (
    <ModalBase onCerrar={onCerrar} conLogo ancho="pequeno" etiqueta="Inscripción realizada">
      <h2 className="modal__titulo modal__titulo--chico">Inscripción realizada correctamente</h2>
      {evento?.nombre_evento && (
        <p className="modal__texto">
          Ya tienes lugar en <strong>{evento.nombre_evento}</strong>.
        </p>
      )}
      <p className="modal__texto modal__texto--fuerte">Tu boleto lo puedes ver en “Mis boletos”.</p>
      <div className="modal__acciones">
        <button type="button" className="boton" onClick={verMisBoletos}>
          Ver mis boletos
        </button>
        <button type="button" className="boton" onClick={onCerrar}>
          Cerrar
        </button>
      </div>
    </ModalBase>
  );
}
