import { useEffect, useRef, useState } from 'react';
import Icono from './Icono.jsx';

// Botón "Filtrar" con lista desplegable de opciones.
// opciones: [{ valor, texto }]  (la primera es "sin filtro")
export default function MenuFiltro({ opciones, valor, onCambiar, clase = '' }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  // Se cierra al hacer clic afuera o con Esc
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    const tecla = (e) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const actual = opciones.find((o) => o.valor === valor) ?? opciones[0];
  const hayFiltro = valor !== opciones[0].valor;

  return (
    <div className="menu-filtro" ref={ref}>
      <button
        type="button"
        className={`boton ${clase}`}
        aria-haspopup="true"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
      >
        <Icono nombre="filter_list" /> Filtrar{hayFiltro ? `: ${actual.texto}` : ''}
      </button>
      {abierto && (
        <ul className="menu-filtro__lista">
          {opciones.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                className={`menu-filtro__opcion ${valor === o.valor ? 'activa' : ''}`}
                onClick={() => {
                  onCambiar(o.valor);
                  setAbierto(false);
                }}
              >
                {o.texto}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
