import { useEffect, useState } from 'react';
import { useClaves } from '../../controllers/useClaves.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import Campo from '../components/Campo.jsx';

const validarClave = (v) => {
  const t = v.trim();
  if (t.length < 6) return 'Debe tener al menos 6 caracteres';
  if (t.length > 100) return 'No puede superar los 100 caracteres';
  if (/[\s<>]/.test(t)) return 'No puede tener espacios ni los caracteres < >';
  return '';
};

// Solo el administrador ve y modifica la clave de registro de organizadores (el servidor también lo valida).
export default function ClaveRegistro({ onCerrar }) {
  const { mostrarAviso } = useModal();
  const { claves, cargando, error, recargar, guardar, guardando, errorGuardar } = useClaves();
  const [clave, setClave] = useState('');
  const [errorCampo, setErrorCampo] = useState('');

  const restaurar = () => {
    if (!claves) return;
    setClave(claves.clave_organizador ?? '');
    setErrorCampo('');
  };

  // Cuando llega (o se actualiza) la clave guardada, se muestra en el campo
  useEffect(restaurar, [claves]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (e) => {
    e.preventDefault();
    const err = validarClave(clave);
    setErrorCampo(err);
    if (err) return;

    const r = await guardar({ clave_organizador: clave.trim() });
    if (r.ok) {
      mostrarAviso('Clave actualizada correctamente');
      recargar();
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} ancho="normal" etiqueta="Clave de registro">
      <h2 className="modal__titulo">Clave</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Solo lo pueden saber empleados</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Clave Organizador:" id="clave-org" error={errorCampo}>
          <input
            id="clave-org"
            className="entrada"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            maxLength={100}
            disabled={cargando}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(errorCampo)}
          />
        </Campo>

        <p className="modal__texto modal__texto--chico">
          Quien se registre escribiendo esta clave crea una cuenta de organizador. Quien deje la clave vacía crea una cuenta de
          visitante. La clave distingue mayúsculas de minúsculas.
        </p>

        {error && <p className="modal__error" role="alert">{error}</p>}
        {errorGuardar && <p className="modal__error" role="alert">{errorGuardar}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton boton--verde" disabled={cargando || guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton boton--amarillo" onClick={restaurar} disabled={cargando || guardando}>
            Descartar
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Salir
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
