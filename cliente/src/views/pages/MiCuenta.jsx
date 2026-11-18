import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  hayErrores,
  validarContrasena,
  validarDni,
  validarGmail,
  validarTelefono,
  validarTexto,
} from '../../models/validaciones.js';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useMiCuenta } from '../../controllers/useMiCuenta.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

// Mi cuenta: ver y editar los datos de mi propia cuenta (visitante u organizador)
export default function MiCuenta() {
  const navigate = useNavigate();
  const { usuario, cerrarSesion } = useAuth();
  const { mostrarAviso, abrirModal } = useModal();
  const { actualizar, cargando, error } = useMiCuenta();

  const inicial = {
    nombre: usuario.nombre,
    gmail: usuario.gmail,
    dni: usuario.dni ?? '',
    numero_tel: usuario.numero_tel ?? '',
    contrasena: '',
  };
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [ver, setVer] = useState(false);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const descartar = () => {
    setValores(inicial);
    setErrores({});
  };

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nombre: validarTexto(valores.nombre, 'El nombre', 100),
      gmail: validarGmail(valores.gmail),
      dni: validarDni(valores.dni),
      numero_tel: validarTelefono(valores.numero_tel),
      contrasena: validarContrasena(valores.contrasena, { obligatoria: false }),
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const datos = {
      nombre: valores.nombre.trim(),
      gmail: valores.gmail.trim(),
      dni: valores.dni.trim(),
      numero_tel: valores.numero_tel.trim(),
    };
    if (valores.contrasena) datos.contrasena = valores.contrasena;

    const r = await actualizar(datos);
    if (!r.ok) return;

    // Cambiaron datos de acceso: hay que iniciar sesión de nuevo con los datos nuevos
    if (r.datos.sesionCerrada) {
      await cerrarSesion();
      navigate('/');
      mostrarAviso('Datos actualizados. Inicia sesión nuevamente con tus datos nuevos.');
      abrirModal('login');
    } else {
      mostrarAviso('No hiciste cambios en tus datos.');
    }
  };

  return (
    <Panel titulo="Mi cuenta">
      <div className="tarjeta-formulario">
        <h3 className="modal__subtitulo modal__subtitulo--linea">Mis datos</h3>

        <form onSubmit={enviar} noValidate>
          <Campo etiqueta="Nombre:" id="mc-nombre" error={errores.nombre}>
            <input id="mc-nombre" className="entrada" value={valores.nombre} onChange={cambiar('nombre')} maxLength={100} autoComplete="name" aria-invalid={Boolean(errores.nombre)} />
          </Campo>
          <Campo etiqueta="Gmail:" id="mc-gmail" error={errores.gmail}>
            <input id="mc-gmail" type="email" className="entrada" value={valores.gmail} onChange={cambiar('gmail')} maxLength={254} autoComplete="email" inputMode="email" aria-invalid={Boolean(errores.gmail)} />
          </Campo>
          <Campo etiqueta="DNI:" id="mc-dni" error={errores.dni}>
            <input id="mc-dni" className="entrada" value={valores.dni} onChange={cambiar('dni')} maxLength={8} inputMode="numeric" autoComplete="off" aria-invalid={Boolean(errores.dni)} />
          </Campo>
          <Campo etiqueta="Número de teléfono:" id="mc-tel" error={errores.numero_tel}>
            <input id="mc-tel" type="tel" className="entrada" value={valores.numero_tel} onChange={cambiar('numero_tel')} maxLength={20} autoComplete="tel" inputMode="tel" aria-invalid={Boolean(errores.numero_tel)} />
          </Campo>
          <Campo
            etiqueta="Contraseña:"
            id="mc-pass"
            error={errores.contrasena}
            ayuda="Por seguridad tu contraseña se guarda cifrada y no se puede mostrar. Escribe una nueva solo si quieres cambiarla (mínimo 8 caracteres)."
          >
            <div className="entrada-con-icono">
              <input id="mc-pass" type={ver ? 'text' : 'password'} className="entrada" value={valores.contrasena} onChange={cambiar('contrasena')} maxLength={72} autoComplete="new-password" placeholder="••••••••" aria-invalid={Boolean(errores.contrasena)} />
              <button type="button" className="entrada-con-icono__boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Icono nombre={ver ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
          </Campo>

          <p className="modal__advertencia">
            <Icono nombre="info" />
            <span>Si cambias tus datos o tu contraseña, se cerrará tu sesión y tendrás que iniciar sesión con los datos nuevos.</span>
          </p>

          {error && <p className="modal__error" role="alert">{error}</p>}

          <div className="modal__acciones">
            <button type="submit" className="boton" disabled={cargando}>
              {cargando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="boton" onClick={descartar} disabled={cargando}>
              Descartar
            </button>
          </div>
        </form>
      </div>
    </Panel>
  );
}
