import { useState } from 'react';
import { minutosSegundos } from '../../models/formato.js';
import { useCancelacion } from '../../controllers/useCancelacion.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';

export default function CancelarInscripcion({ onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { cancelar, cargando, error, intentosRestantes, segundosRestantes, bloqueado } = useCancelacion();
  const [codigo, setCodigo] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || bloqueado) return;
    const ok = await cancelar(codigo.trim().toUpperCase());
    if (ok) {
      refrescarDatos();
      onCerrar();
      mostrarAviso('Inscripción cancelada. Tu lugar fue liberado.');
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Cancelar inscripción">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Cancelar inscripción</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Ingresa el código de tu boleto</p>

      <form onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Código:"
          id="can-codigo"
          ayuda="Son 8 caracteres (letras y números). Lo recibiste por correo y se mostró al inscribirte."
        >
          <input
            id="can-codigo"
            className="entrada entrada--codigo"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={8}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            disabled={bloqueado}
            autoFocus
          />
        </Campo>

        {bloqueado ? (
          <p className="modal__error" role="alert">
            Demasiados intentos fallidos. Podrás intentar nuevamente en {minutosSegundos(segundosRestantes)}.
          </p>
        ) : (
          error && (
            <p className="modal__error" role="alert">
              {error}
              {intentosRestantes !== null && ` Intentos restantes: ${intentosRestantes}.`}
            </p>
          )
        )}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando || bloqueado || codigo.length === 0}>
            {cargando ? 'Cancelando…' : 'Cancelar inscripción'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Descartar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
