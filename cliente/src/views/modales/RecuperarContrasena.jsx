import { useState } from 'react';
import { authApi } from '../../models/api/authApi.js';
import { validarGmail } from '../../models/validaciones.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import { useAccion } from '../../controllers/useAccion.js';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';

// Recuperación de contraseña: se ingresa el correo y se envía un enlace para elegir una nueva
export default function RecuperarContrasena({ onCerrar }) {
  const { mostrarAviso } = useModal();
  const { ejecutar, cargando, error } = useAccion();
  const [gmail, setGmail] = useState('');
  const [errorCampo, setErrorCampo] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    const err = validarGmail(gmail);
    setErrorCampo(err);
    if (err) return;

    const r = await ejecutar(() => authApi.recuperar(gmail.trim()));
    if (r.ok) {
      onCerrar();
      mostrarAviso(r.datos.mensaje);
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Cambiar contraseña">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Cambiar contraseña</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Ingrese el correo de su cuenta</p>
      <p className="modal__texto">
        Te enviaremos un correo con el enlace para cambiar tu contraseña. El enlace vence en 1 hora.
      </p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Gmail:" id="rec-gmail" error={errorCampo}>
          <input
            id="rec-gmail"
            type="email"
            className="entrada"
            value={gmail}
            onChange={(e) => setGmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            autoFocus
            aria-invalid={Boolean(errorCampo)}
          />
        </Campo>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Enviando…' : 'Enviar enlace'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
