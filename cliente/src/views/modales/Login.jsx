import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hayErrores, validarGmail } from '../../models/validaciones.js';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useModal } from '../../controllers/ModalContext.jsx';
import { useAccion } from '../../controllers/useAccion.js';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

export default function Login({ onCerrar }) {
  const { iniciarSesion } = useAuth();
  const { abrirModal, mostrarAviso } = useModal();
  const navigate = useNavigate();
  const { ejecutar, cargando, error } = useAccion();
  const [valores, setValores] = useState({ gmail: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [ver, setVer] = useState(false);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      gmail: validarGmail(valores.gmail),
      contrasena: valores.contrasena ? '' : 'La contraseña es obligatoria',
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const r = await ejecutar(() => iniciarSesion(valores.gmail.trim(), valores.contrasena));
    if (r.ok) {
      onCerrar();
      mostrarAviso('Sesión iniciada correctamente');
      navigate('/gestion/eventos');
    } else if (r.error.status === 403) {
      // Credenciales correctas pero cuenta sin aprobar (regla 6)
      abrirModal('cuenta-no-aprobada');
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Iniciar sesión">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Iniciar sesión</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Solo para organizadores</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Gmail:" id="log-gmail" error={errores.gmail}>
          <input
            id="log-gmail"
            type="email"
            className="entrada"
            value={valores.gmail}
            onChange={cambiar('gmail')}
            autoComplete="email"
            inputMode="email"
            autoFocus
            aria-invalid={Boolean(errores.gmail)}
          />
        </Campo>
        <Campo etiqueta="Contraseña:" id="log-pass" error={errores.contrasena}>
          <div className="entrada-con-icono">
            <input
              id="log-pass"
              type={ver ? 'text' : 'password'}
              className="entrada"
              value={valores.contrasena}
              onChange={cambiar('contrasena')}
              autoComplete="current-password"
              aria-invalid={Boolean(errores.contrasena)}
            />
            <button type="button" className="entrada-con-icono__boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icono nombre={ver ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </Campo>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Descartar
          </button>
        </div>
        <p className="modal__enlace">
          ¿No tienes cuenta?{' '}
          <button type="button" className="boton boton--enlace boton--claro" onClick={() => abrirModal('registro')}>
            Regístrate
          </button>
        </p>
      </form>
    </ModalBase>
  );
}
