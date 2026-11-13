import { useEffect, useState } from 'react';
import { organizadoresApi } from '../../models/api/organizadoresApi.js';
import { copiarTexto } from '../../models/formato.js';
import ModalBase from './ModalBase.jsx';
import Campo from '../components/Campo.jsx';
import Icono from '../components/Icono.jsx';

// Muestra la clave de registro. Solo la ve el administrador (el servidor lo valida).
export default function ClaveRegistro({ onCerrar }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let activo = true;
    organizadoresApi
      .clave()
      .then((r) => activo && setClave(r.clave))
      .catch((e) => activo && setError(e.message));
    return () => {
      activo = false;
    };
  }, []);

  return (
    <ModalBase onCerrar={onCerrar} etiqueta="Clave de registro">
      <h2 className="modal__titulo">Clave</h2>
      <p className="modal__subtitulo modal__subtitulo--linea">Solo lo pueden saber empleados</p>

      <Campo etiqueta="Clave:" id="clave-valor">
        <input id="clave-valor" className="entrada" value={clave} readOnly placeholder={error ? '' : 'Cargando…'} />
      </Campo>
      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        {clave && (
          <button
            type="button"
            className="boton"
            onClick={async () => setCopiado(await copiarTexto(clave))}
          >
            <Icono nombre={copiado ? 'check' : 'content_copy'} /> {copiado ? 'Copiada' : 'Copiar'}
          </button>
        )}
        <button type="button" className="boton" onClick={onCerrar}>
          Salir
        </button>
      </div>
    </ModalBase>
  );
}
