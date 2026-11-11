import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fechaDeTimestamp } from '../../models/formato.js';
import { useAsistencia } from '../../controllers/useAsistencia.js';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import Icono from '../components/Icono.jsx';

const OPCIONES_FILTRO = [
  { valor: 'Todos', texto: 'Todos' },
  { valor: 'Presente', texto: 'Presentes' },
  { valor: 'Ausente', texto: 'Ausentes' },
];

export default function Asistencia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    evento, resumen, visibles, cargando, error,
    busqueda, setBusqueda, filtro, setFiltro, procesando, cambiarEstado,
  } = useAsistencia(id);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const volver = () => navigate('/gestion/eventos');

  const titulo = (
    <>
      {evento ? evento.nombre_evento : 'Evento'}
      <br />
      Tabla asistencia
    </>
  );

  return (
    <Panel titulo={titulo} ancho>
      <div className="barra-asistencia">
        <div className="barra-asistencia__busqueda">
          <label htmlFor="buscar-boleto" className="barra-asistencia__etiqueta">
            Buscar por código, fecha o nombre
          </label>
          <div className="buscador buscador--claro">
            <Icono nombre="search" />
            <input
              id="buscar-boleto"
              type="search"
              className="buscador__entrada"
              placeholder="buscar boleto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <p className="barra-asistencia__contador">
          Presentes {resumen.presentes}/{resumen.total}
        </p>

        <div className="menu-filtro">
          <button
            type="button"
            className="boton"
            aria-haspopup="true"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((a) => !a)}
          >
            <Icono nombre="filter_list" /> Filtrar{filtro !== 'Todos' ? `: ${filtro}s` : ''}
          </button>
          {menuAbierto && (
            <ul className="menu-filtro__lista">
              {OPCIONES_FILTRO.map((o) => (
                <li key={o.valor}>
                  <button
                    type="button"
                    className={`menu-filtro__opcion ${filtro === o.valor ? 'activa' : ''}`}
                    onClick={() => {
                      setFiltro(o.valor);
                      setMenuAbierto(false);
                    }}
                  >
                    {o.texto}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" className="circulo-cerrar" onClick={volver} aria-label="Volver a administrar eventos" title="Volver">
          <Icono nombre="close" />
        </button>
      </div>

      {cargando && <Mensaje tipo="cargando">Cargando asistencia…</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {!cargando && !error && visibles.length === 0 && (
        <Mensaje>{resumen.total === 0 ? 'Todavía no hay inscriptos en este evento.' : 'Ningún boleto coincide con la búsqueda o el filtro.'}</Mensaje>
      )}

      {visibles.length > 0 && (
        <div className="contenedor-vino">
          {visibles.map((b) => (
            <article key={b.id_boleto} className="fila fila--boleto">
              <div className="dato">
                <span className="dato__titulo">Código</span>
                <span className="dato__valor dato__valor--codigo">{b.codigo}</span>
              </div>
              <div className="dato">
                <span className="dato__titulo">Fecha de creación</span>
                <span className="dato__valor">{fechaDeTimestamp(b.fecha_creacion)}</span>
              </div>
              <div className="dato">
                <span className="dato__titulo">Nombre</span>
                <span className="dato__valor">{b.nombre}</span>
              </div>
              <div className="dato dato--ancho">
                <span className="dato__titulo">Gmail</span>
                <span className="dato__valor">{b.gmail}</span>
              </div>
              <div className="dato dato--estado">
                <span className="dato__titulo">Estado</span>
                <button
                  type="button"
                  className={`boton boton--chico ${b.estado === 'Presente' ? 'boton--verde' : 'boton--rojo'}`}
                  onClick={() => cambiarEstado(b)}
                  disabled={procesando === b.id_boleto}
                  title="Clic para cambiar el estado"
                >
                  {b.estado}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
