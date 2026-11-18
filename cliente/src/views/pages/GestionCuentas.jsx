import { useState } from 'react';
import Panel from '../components/Panel.jsx';
import ListaCuentas from '../components/ListaCuentas.jsx';

const PESTANAS = [
  { tipo: 'organizador', texto: 'Organizadores' },
  { tipo: 'visitante', texto: 'Visitantes' },
];

// Gestionar cuentas: una pestaña para organizadores y otra para visitantes
export default function GestionCuentas() {
  const [tipo, setTipo] = useState('organizador');

  return (
    <Panel titulo="Gestionar cuentas" ancho>
      <div className="contenedor-vino">
        <div className="pestanas" role="tablist" aria-label="Tipo de cuenta">
          {PESTANAS.map((p) => (
            <button
              key={p.tipo}
              type="button"
              role="tab"
              aria-selected={tipo === p.tipo}
              className={`boton pestanas__boton ${tipo === p.tipo ? 'activa' : ''}`}
              onClick={() => setTipo(p.tipo)}
            >
              {p.texto}
            </button>
          ))}
        </div>
        <ListaCuentas key={tipo} tipo={tipo} />
      </div>
    </Panel>
  );
}