import { useEffect, useState } from 'react';
import { useAccionesCuenta } from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import Icono from '../components/Icono.jsx';

// Se prioriza "Deshabilitar" sobre "Eliminar" y se explica todo lo que se pierde en el borrado en cascada
export default function EliminarCuenta({ cuenta, onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { impacto, aprobacion, eliminar, cargando, error } = useAccionesCuenta();
  const [datos, setDatos] = useState(null);
  const [errorImpacto, setErrorImpacto] = useState('');

  useEffect(() => {
    let activo = true;
    impacto(cuenta.id_organizador)
      .then((r) => activo && setDatos(r))
      .catch((e) => activo && setErrorImpacto(e.message));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuenta.id_organizador]);

  const deshabilitar = async () => {
    const r = await aprobacion(cuenta.id_organizador, false);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Cuenta deshabilitada. Su sesión se cerró.');
    }
  };

  const borrar = async () => {
    const r = await eliminar(cuenta.id_organizador);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Usuario eliminado correctamente');
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} conLogo ancho="normal" etiqueta="Eliminar cuenta">
      <h2 className="modal__titulo modal__titulo--chico">¿Seguro que quieres eliminar la cuenta de {cuenta.nombre}?</h2>
      <p className="modal__texto modal__texto--fuerte">No podrás deshacerlo</p>

      <div className="modal__advertencia modal__advertencia--columna">
        <p>
          <Icono nombre="warning" /> <strong>Se borrará todo esto de forma permanente:</strong>
        </p>
        {errorImpacto && <p>No se pudo calcular el impacto: {errorImpacto}</p>}
        {!datos && !errorImpacto && <p>Calculando…</p>}
        {datos && (
          <ul>
            <li>La cuenta de {cuenta.gmail}</li>
            <li>{datos.eventos} evento(s) creados por esta cuenta</li>
            <li>{datos.boletos} boleto(s) / inscripciones de esos eventos</li>
          </ul>
        )}
      </div>

      {cuenta.aprobacion && (
        <div className="modal__recomendacion">
          <p>
            <Icono nombre="info" /> Si solo quieres que no pueda iniciar sesión, es mejor <strong>deshabilitarla</strong>: la
            cuenta y sus eventos se conservan y puedes volver a habilitarla cuando quieras.
          </p>
          <button type="button" className="boton" onClick={deshabilitar} disabled={cargando}>
            <Icono nombre="block" /> Deshabilitar cuenta
          </button>
        </div>
      )}

      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        <button type="button" className="boton" onClick={onCerrar}>
          Descartar
        </button>
        <button type="button" className="boton boton--rojo" onClick={borrar} disabled={cargando}>
          {cargando ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </div>
    </ModalBase>
  );
}
