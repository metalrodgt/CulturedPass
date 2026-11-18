import { Link } from 'react-router-dom';
import { fechaDeTimestamp, fechaLegible } from '../../models/formato.js';
import { FILTROS_ESTADO_BOLETO, useMisBoletos } from '../../controllers/useMisBoletos.js';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import MenuFiltro from '../components/MenuFiltro.jsx';
import Icono from '../components/Icono.jsx';

// Lista de los boletos de los eventos en los que estoy inscripto (aquí se ve el código de cada boleto)
export default function MisBoletos() {
  const { boletos, visibles, cargando, error, busqueda, setBusqueda, estado, setEstado } = useMisBoletos();

  return (
    <Panel titulo="Mis boletos" ancho>
      <div className="barra-boletos">
        <div>
          <label htmlFor="buscar-mis-boletos" className="barra-asistencia__etiqueta">
            Buscar por código, fecha o nombre del evento
          </label>
          <div className="buscador buscador--claro">
            <Icono nombre="search" />
            <input
              id="buscar-mis-boletos"
              type="search"
              className="buscador__entrada"
              placeholder="buscar boleto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
        <p className="barra-boletos__contador">
          {boletos.length} boleto{boletos.length === 1 ? '' : 's'} inscripto{boletos.length === 1 ? '' : 's'}
        </p>
        <MenuFiltro opciones={FILTROS_ESTADO_BOLETO} valor={estado} onCambiar={setEstado} />
      </div>

      {cargando && <Mensaje tipo="cargando">Cargando tus boletos…</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {!cargando && !error && boletos.length === 0 && (
        <>
          <Mensaje>Todavía no te inscribiste a ningún evento.</Mensaje>
          <p className="panel__acciones">
            <Link to="/eventos" className="boton">
              Ver eventos disponibles
            </Link>
          </p>
        </>
      )}
      {!cargando && !error && boletos.length > 0 && visibles.length === 0 && (
        <Mensaje>Ningún boleto coincide con la búsqueda o el filtro.</Mensaje>
      )}

      {visibles.length > 0 && (
        <div className="contenedor-vino">
          {visibles.map((b) => (
            <article key={b.id_boleto} className="fila fila--miboleto">
              <div className="dato">
                <span className="dato__titulo">Código</span>
                <span className="dato__valor dato__valor--codigo">{b.codigo}</span>
              </div>
              <div className="dato">
                <span className="dato__titulo">Fecha de creación</span>
                <span className="dato__valor">{fechaDeTimestamp(b.fecha_creacion)}</span>
              </div>
              <div className="dato dato--ancho">
                <span className="dato__titulo">Nombre evento</span>
                <span className="dato__valor">{b.evento.nombre_evento}</span>
                <span className="dato__sub">
                  {fechaLegible(b.evento.fecha_evento)} · {b.evento.hora_inicio}
                  {b.evento.estado === 'Finalizado' ? ' · finalizado' : ''}
                </span>
              </div>
              <div className="dato dato--ancho">
                <span className="dato__titulo">Gmail</span>
                <span className="dato__valor">{b.gmail}</span>
              </div>
              <div className="dato">
                <span className="dato__titulo">Estado</span>
                <span className={`boton boton--chico estado-fijo ${b.estado === 'Presente' ? 'boton--verde' : 'boton--rojo'}`}>
                  {b.estado}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
