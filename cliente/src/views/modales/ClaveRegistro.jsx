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

// Solo el administrador ve y modifica las claves de registro (el servidor también lo valida).
export default function ClaveRegistro({ onCerrar }) {
  const { mostrarAviso } = useModal();
  const { claves, cargando, error, recargar, guardar, guardando, errorGuardar } = useClaves();
  const [valores, setValores] = useState({ clave_organizador: '', clave_visitante: '' });
  const [errores, setErrores] = useState({});

  const restaurar = () => {
    if (!claves) return;
    setValores({ clave_organizador: claves.clave_organizador ?? '', clave_visitante: claves.clave_visitante ?? '' });
    setErrores({});
  };

  // Cuando llegan (o se actualizan) las claves guardadas, se muestran en los campos
  useEffect(restaurar, [claves]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      clave_organizador: validarClave(valores.clave_organizador),
      clave_visitante: validarClave(valores.clave_visitante),
    };
    if (!nuevos.clave_visitante && valores.clave_organizador.trim() === valores.clave_visitante.trim()) {
      nuevos.clave_visitante = 'Debe ser diferente a la clave de organizador';
    }
    setErrores(nuevos);
    if (nuevos.clave_organizador || nuevos.clave_visitante) return;

    const r = await guardar({
      clave_organizador: valores.clave_organizador.trim(),
      clave_visitante: valores.clave_visitante.trim(),
    });
    if (r.ok) {
      mostrarAviso('Claves actualizadas correctamente');
      recargar();
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} ancho="normal" etiqueta="Claves de registro">
      <h2 className="modal__titulo">Clave</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Solo lo pueden saber empleados</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Clave Organizador:" id="clave-org" error={errores.clave_organizador}>
          <input id="clave-org" className="entrada" value={valores.clave_organizador} onChange={cambiar('clave_organizador')} maxLength={100} disabled={cargando} autoComplete="off" spellCheck={false} aria-invalid={Boolean(errores.clave_organizador)} />
        </Campo>
        <Campo etiqueta="Clave Visitante:" id="clave-vis" error={errores.clave_visitante}>
          <input id="clave-vis" className="entrada" value={valores.clave_visitante} onChange={cambiar('clave_visitante')} maxLength={100} disabled={cargando} autoComplete="off" spellCheck={false} aria-invalid={Boolean(errores.clave_visitante)} />
        </Campo>

        <p className="modal__texto modal__texto--chico">
          Quien se registre con la clave de organizador crea una cuenta de organizador; con la de visitante, una cuenta de visitante.
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