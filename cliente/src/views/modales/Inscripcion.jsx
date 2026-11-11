import { useState } from 'react';
import { hayErrores, validarGmail, validarTexto } from '../../models/validaciones.js';
import { useInscripcion } from '../../controllers/useInscripcion.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import Campo from '../components/Campo.jsx';

export default function Inscripcion({ evento, onCerrar }) {
  const { abrirModal, refrescarDatos } = useModal();
  const { inscribirse, cargando, error } = useInscripcion();
  const [valores, setValores] = useState({ nombre: '', gmail: '' });
  const [errores, setErrores] = useState({});

  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    const nuevos = {
      nombre: validarTexto(valores.nombre, 'El nombre', 100),
      gmail: validarGmail(valores.gmail),
    };
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;

    const r = await inscribirse(evento.id_evento, { nombre: valores.nombre.trim(), gmail: valores.gmail.trim() });
    if (r.ok) {
      refrescarDatos();
      // Regla 18: el código se muestra una sola vez en esta ventana
      abrirModal('codigo-boleto', { boleto: r.datos.boleto, evento: r.datos.evento });
    }
  };

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Inscripción a evento">
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo">
        Inscripción a
        <br />“{evento.nombre_evento}”
      </h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Rellenar datos</p>

      <form onSubmit={enviar} noValidate>
        <Campo etiqueta="Nombre completo:" id="ins-nombre" error={errores.nombre}>
          <input
            id="ins-nombre"
            className="entrada"
            value={valores.nombre}
            onChange={cambiar('nombre')}
            maxLength={100}
            autoComplete="name"
            autoFocus
            aria-invalid={Boolean(errores.nombre)}
          />
        </Campo>
        <Campo etiqueta="Correo electrónico:" id="ins-gmail" error={errores.gmail}>
          <input
            id="ins-gmail"
            type="email"
            className="entrada"
            value={valores.gmail}
            onChange={cambiar('gmail')}
            maxLength={254}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errores.gmail)}
          />
        </Campo>

        {error && <p className="modal__error" role="alert">{error}</p>}

        <div className="modal__acciones">
          <button type="submit" className="boton" disabled={cargando}>
            {cargando ? 'Inscribiendo…' : 'Inscribirse'}
          </button>
          <button type="button" className="boton" onClick={onCerrar}>
            Descartar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
