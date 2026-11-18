import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../models/api/authApi.js';
import { hayErrores, validarContrasena } from '../../models/validaciones.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import { useAccion } from '../../controllers/useAccion.js';
import Panel from '../components/Panel.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

// Sección a la que se llega desde el enlace del correo de recuperación (?token=...)
export default function CambiarContrasena() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const { mostrarAviso, abrirModal } = useModal();
  const { ejecutar, cargando, error } = useAccion();
  const [valores, setValores] = useState({ nueva: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [ver, setVer] = useState(false);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nueva: validarContrasena(valores.nueva),
      confirmar: valores.confirmar !== valores.nueva ? 'Las contraseñas no coinciden' : '',
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const r = await ejecutar(() => authApi.restablecer(token, valores.nueva));
    if (r.ok) {
      navigate('/');
      mostrarAviso('Contraseña actualizada correctamente.');
      abrirModal('login'); // se abre la ventana para iniciar sesión con la contraseña nueva
    }
  };

  return (
    <Panel titulo="Cambiar contraseña">
      <div className="tarjeta-formulario">
        {!token ? (
          <>
            <p className="modal__error" role="alert">El enlace no es válido. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.</p>
            <div className="modal__acciones">
              <button type="button" className="boton" onClick={() => navigate('/')}>
                Volver al inicio
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="modal__subtitulo modal__subtitulo--linea">Ingrese su nueva contraseña</h3>
            <form onSubmit={enviar} noValidate>
              <Campo etiqueta="Nueva contraseña:" id="cc-nueva" error={errores.nueva} ayuda="Mínimo 8 caracteres.">
                <div className="entrada-con-icono">
                  <input id="cc-nueva" type={ver ? 'text' : 'password'} className="entrada" value={valores.nueva} onChange={cambiar('nueva')} maxLength={72} autoComplete="new-password" autoFocus aria-invalid={Boolean(errores.nueva)} />
                  <button type="button" className="entrada-con-icono__boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                    <Icono nombre={ver ? 'visibility_off' : 'visibility'} />
                  </button>
                </div>
              </Campo>
              <Campo etiqueta="Confirmar contraseña:" id="cc-confirmar" error={errores.confirmar}>
                <input id="cc-confirmar" type={ver ? 'text' : 'password'} className="entrada" value={valores.confirmar} onChange={cambiar('confirmar')} maxLength={72} autoComplete="new-password" aria-invalid={Boolean(errores.confirmar)} />
              </Campo>

              {error && <p className="modal__error" role="alert">{error}</p>}

              <div className="modal__acciones">
                <button type="submit" className="boton" disabled={cargando}>
                  {cargando ? 'Guardando…' : 'Confirmar'}
                </button>
                <button type="button" className="boton" onClick={() => navigate('/')}>
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Panel>
  );
}
