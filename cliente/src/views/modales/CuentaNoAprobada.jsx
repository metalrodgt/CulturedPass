import ModalBase from './ModalBase.jsx';

export default function CuentaNoAprobada({ onCerrar }) {
  return (
    <ModalBase onCerrar={onCerrar} conLogo ancho="pequeno" etiqueta="Cuenta no aprobada">
      <p className="modal__titulo modal__titulo--chico">
        Tu cuenta no está aprobada, espera a que un organizador la apruebe
      </p>
      <div className="modal__acciones">
        <button type="button" className="boton" onClick={onCerrar}>
          Entendido
        </button>
      </div>
    </ModalBase>
  );
}
