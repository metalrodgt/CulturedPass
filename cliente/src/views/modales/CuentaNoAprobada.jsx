import ModalBase from './ModalBase.jsx';

export default function CuentaNoAprobada({ rol, onCerrar }) {
  // Las cuentas de visitante las autoriza un organizador; las de organizador, un administrador
  const quien = rol === 'organizador' ? 'un administrador' : 'un organizador';
  return (
    <ModalBase onCerrar={onCerrar} conLogo ancho="pequeno" etiqueta="Cuenta no autorizada">
      <p className="modal__titulo modal__titulo--chico">
        Tu cuenta no está autorizada, espera a que {quien} la autorice
      </p>
      <div className="modal__acciones">
        <button type="button" className="boton" onClick={onCerrar}>
          Entendido
        </button>
      </div>
    </ModalBase>
  );
}