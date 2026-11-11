import Icono from './Icono.jsx';

export default function BotonCerrar({ onClick }) {
  return (
    <button type="button" className="modal__cerrar" onClick={onClick} aria-label="Cerrar ventana">
      <Icono nombre="close" />
    </button>
  );
}
