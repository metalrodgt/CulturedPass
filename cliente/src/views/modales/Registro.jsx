import { useState } from 'react';
import { authApi } from '../../models/api/authApi.js';
import {
  hayErrores,
  validarContrasena,
  validarDni,
  validarGmail,
  validarTelefono,
  validarTexto,
} from '../../models/validaciones.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import { useAccion } from '../../controllers/useAccion.js';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

// Crear cuenta. La CLAVE decide el tipo de cuenta:
//  - clave de organizador -> cuenta de organizador
//  - clave de visitante   -> cuenta de visitante
export default function Registro({ onCerrar }) {
  const { mostrarAviso } = useModal();
  const { ejecutar, cargando, error } = useAccion();
  const [valores, setValores] = useState({ nombre: '', gmail: '', dni: '', numero_tel: '', contrasena: '', clave: '' });
  const [errores, setErrores] = useState({});
  const [ver, setVer] = useState(false);
  const [verClave, setVerClave] = useState(false);

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nombre: validarTexto(valores.nombre, 'El nombre', 100),
      gmail: validarGmail(valores.gmail),
      dni: validarDni(valores.dni),
      numero_tel: validarTelefono(valores.numero_tel),
      contrasena: validarContrasena(valores.contrasena),
      clave: valores.clave.trim() ? '' : 'La clave es obligatoria',
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const r = await ejecutar(() =>
      authApi.registro({
        nombre: valores.nombre.trim(),
        gmail: valores.gmail.trim(),
        dni: valores.dni.trim(),
        numero_tel: valores.numero_tel.trim(),
        contrasena: valores.contrasena,
        clave: valores.clave.trim(),
      }),
    );
    if (r.ok) {
      onCerrar();
      mostrarAviso(`Usuario creado correctamente. ${r.datos.mensaje}`);
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} ancho="normal" etiqueta="Crear cuenta">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">Crear cuenta</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Rellenar campos</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre:" id="reg-nombre" error={errores.nombre}>
          <input id="reg-nombre" className="entrada" value={valores.nombre} onChange={cambiar('nombre')} maxLength={100} autoComplete="name" autoFocus aria-invalid={Boolean(errores.nombre)} />
        </Campo>
        <Campo etiqueta="Gmail:" id="reg-gmail" error={errores.gmail}>
          <input id="reg-gmail" type="email" className="entrada" value={valores.gmail} onChange={cambiar('gmail')} maxLength={254} autoComplete="email" inputMode="email" aria-invalid={Boolean(errores.gmail)} />
        </Campo>
        <Campo etiqueta="DNI:" id="reg-dni" error={errores.dni} ayuda="7 u 8 números, sin puntos.">
          <input id="reg-dni" className="entrada" value={valores.dni} onChange={cambiar('dni')} maxLength={8} inputMode="numeric" autoComplete="off" aria-invalid={Boolean(errores.dni)} />
        </Campo>
        <Campo etiqueta="Número de teléfono:" id="reg-tel" error={errores.numero_tel}>
          <input id="reg-tel" type="tel" className="entrada" value={valores.numero_tel} onChange={cambiar('numero_tel')} maxLength={20} autoComplete="tel" inputMode="tel" aria-invalid={Boolean(errores.numero_tel)} />
        </Campo>
        <Campo etiqueta="Contraseña:" id="reg-pass" error={errores.contrasena} ayuda="Mínimo 8 caracteres.">
          <div className="entrada-con-icono">
            <input id="reg-pass" type={ver ? 'text' : 'password'} className="entrada" value={valores.contrasena} onChange={cambiar('contrasena')} maxLength={72} autoComplete="new-password" aria-invalid={Boolean(errores.contrasena)} />
            <button type="button" className="entrada-con-icono__boton" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icono nombre={ver ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </Campo>
        <Campo etiqueta="Clave:" id="reg-clave" error={errores.clave} ayuda="Te la entrega el personal de CulturedPass.">
          <div className="entrada-con-icono">
            <input id="reg-clave" type={verClave ? 'text' : 'password'} className="entrada" value={valores.clave} onChange={cambiar('clave')} maxLength={100} autoComplete="off" aria-invalid={Boolean(errores.clave)} />
            <button type="button" className="entrada-con-icono__boton" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? 'Ocultar clave' : 'Mostrar clave'}>
              <Icono nombre={verClave ? 'visibility_off' : 'visibility'} />
            </button>
          </div>
        </Campo>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Creando…' : 'Crear'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Descartar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}