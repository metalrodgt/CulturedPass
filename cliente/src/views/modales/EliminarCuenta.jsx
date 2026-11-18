import { useEffect, useState } from 'react';
import { idDeCuenta, useAccionesCuenta } from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import Icono from '../components/Icono.jsx';

// Se prioriza "Deshabilitar" sobre "Eliminar". tipo: 'organizador' | 'visitante'
export default function EliminarCuenta({ cuenta, tipo = 'organizador', onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { impacto, aprobacion, eliminar, cargando, error } = useAccionesCuenta(tipo);
  const id = idDeCuenta(cuenta);
  const esOrganizador = tipo === 'organizador';
  const [datos, setDatos] = useState(null);
  const [errorImpacto, setErrorImpacto] = useState('');

  // Solo las cuentas de organizador arrastran eventos y boletos en cascada
  useEffect(() => {
    if (!esOrganizador) return undefined;
    let activo = true;
    impacto(id)
      .then((r) => activo && setDatos(r))
      .catch((e) => activo && setErrorImpacto(e.message));
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, esOrganizador]);

  const deshabilitar = async () => {
    const r = await aprobacion(id, false);
    if (r.ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Cuenta deshabilitada. Su sesión se cerró.');
    }
  };

  const borrar = async () => {
    const r = await eliminar(id);
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
          <Icono nombre="warning" /> <strong>Se borrará de forma permanente:</strong>
        </p>
        <ul>
          <li>La cuenta de {cuenta.gmail}</li>
          {esOrganizador && errorImpacto && <li>No se pudo calcular el impacto: {errorImpacto}</li>}
          {esOrganizador && !datos && !errorImpacto && <li>Calculando…</li>}
          {esOrganizador && datos && (
            <>
              <li>{datos.eventos} evento(s) creados por esta cuenta</li>
              <li>{datos.boletos} boleto(s) / inscripciones de esos eventos</li>
            </>
          )}
          {!esOrganizador && <li>Los boletos que ya emitió se conservan.</li>}
        </ul>
      </div>

      {cuenta.aprobacion && (
        <div className="modal__recomendacion">
          <p>
            <Icono nombre="info" /> Si solo quieres que no pueda iniciar sesión, es mejor <strong>deshabilitarla</strong>: la
            cuenta se conserva y puedes volver a autorizarla cuando quieras.
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