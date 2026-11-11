import { useState } from 'react';
import {
  hayErrores,
  validarContrasena,
  validarGmail,
  validarTelefono,
  validarTexto,
} from '../../models/validaciones.js';
import { useAccionesCuenta } from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

export default function EditarCuenta({ cuenta, onCerrar }) {
  const { mostrarAviso, refrescarDatos } = useModal();
  const { editar, aprobacion, cargando, error } = useAccionesCuenta();
  const [valores, setValores] = useState({
    nombre: cuenta.nombre,
    gmail: cuenta.gmail,
    numero_tel: cuenta.numero_tel,
    contrasena: '',
  });
  const [aprobada, setAprobada] = useState(cuenta.aprobacion);
  const [errores, setErrores] = useState({});
  const [ver, setVer] = useState(false);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nombre: validarTexto(valores.nombre, 'El nombre', 100),
      gmail: validarGmail(valores.gmail),
      numero_tel: validarTelefono(valores.numero_tel),
      contrasena: validarContrasena(valores.contrasena, { obligatoria: false }),
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const datos = {
      nombre: valores.nombre.trim(),
      gmail: valores.gmail.trim(),
      numero_tel: valores.numero_tel.trim(),
    };
    if (valores.contrasena) datos.contrasena = valores.contrasena;

    const r = await editar(cuenta.id_organizador, datos);
    if (!r.ok) return;
    if (aprobada !== cuenta.aprobacion) {
      const r2 = await aprobacion(cuenta.id_organizador, aprobada);
      if (!r2.ok) return;
    }
    refrescarDatos();
    onCerrar();
    mostrarAviso('Usuario editado correctamente');
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Editar usuario">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Editar usuario</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Editar datos</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre:" id="cue-nombre" error={errores.nombre}>
          <input id="cue-nombre" className="entrada" value={valores.nombre} onChange={cambiar('nombre')} maxLength={100} autoFocus aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <Campo etiqueta="Gmail:" id="cue-gmail" error={errores.gmail}>
          <input id="cue-gmail" type="email" className="entrada" value={valores.gmail} onChange={cambiar('gmail')} maxLength={254} inputMode="email" aria-invalid={Boolean(errores.gmail)} />
        </Campo>
        <Campo etiqueta="Número de teléfono:" id="cue-tel" error={errores.numero_tel}>
          <input id="cue-tel" type="tel" className="entrada" value={valores.numero_tel} onChange={cambiar('numero_tel')} maxLength={20} inputMode="tel" aria-invalid={Boolean(errores.numero_tel)} />
        </Campo>
        <Campo etiqueta="Contraseña:" id="cue-pass" error={errores.contrasena} ayuda="Déjala vacía para no cambiarla. Mínimo 8 caracteres.">
          <div className="entrada-con-icono">
            <input id="cue-pass" type={ver ? 'text' : 'password'} className="entrada" value={valores.contrasena} onChange={cambiar('contrasena')} maxLength={72} autoComplete="new-password" placeholder="Nueva contraseña (opcional)" aria-invalid={Boolean(errores.contrasena)} />
            <button type="button" className="entrada-con-icono__boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icono nombre={ver ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </Campo>
        <Campo etiqueta="Aprobación:" id="cue-aprob" ayuda="Si la deshabilitas, su sesión se cerrará.">
          <button
            id="cue-aprob"
            type="button"
            className={`boton boton--chico ${aprobada ? 'boton--verde' : 'boton--rojo'}`}
            onClick={() => setAprobada((a) => !a)}
            aria-pressed={aprobada}
          >
            {aprobada ? 'True' : 'False'}
          </button>
        </Campo>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Descartar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
