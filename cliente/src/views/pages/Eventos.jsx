import { useSearchParams } from 'react-router-dom';
import {
  FILTROS_DISPONIBILIDAD,
  useEventosDisponibles,
  useFiltrosEventos,
} from '../../controllers/useEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import MenuFiltro from '../components/MenuFiltro.jsx';
import TarjetaEvento from '../components/TarjetaEvento.jsx';
import Icono from '../components/Icono.jsx';

export default function Eventos() {
  const [params, setParams] = useSearchParams();
  const buscar = (params.get('buscar') ?? '').trim();
  const { eventos, cargando, error } = useEventosDisponibles();
  const { filtrados, disponibilidad, setDisponibilidad } = useFiltrosEventos(eventos, buscar);
  const { abrirModal } = useModal();

  const hayFiltros = Boolean(buscar) || disponibilidad !== 'todos';

  return (
    <Panel titulo="Eventos disponibles">
      <div className="barra-eventos">
        <p className="barra-eventos__conteo">
          {filtrados.length} evento{filtrados.length === 1 ? '' : 's'}
        </p>
        <MenuFiltro opciones={FILTROS_DISPONIBILIDAD} valor={disponibilidad} onCambiar={setDisponibilidad} />
      </div>

      {buscar && (
        <p className="filtro-activo">
          Resultados para “{buscar}”
          <button type="button" className="boton boton--enlace" onClick={() => setParams({})}>
            <Icono nombre="close" /> Quitar búsqueda
          </button>
        </p>
      )}

      {cargando && <Mensaje tipo="cargando">Cargando eventos…</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {!cargando && !error && filtrados.length === 0 && (
        <Mensaje>
          {hayFiltros ? 'No hay eventos que coincidan con la búsqueda o el filtro.' : 'No hay eventos disponibles por ahora.'}
        </Mensaje>
      )}

      <div className="tarjetas">
        {filtrados.map((e) => (
          <TarjetaEvento
            key={e.id_evento}
            evento={e}
            variante="disponible"
            onVerMas={() => abrirModal('detalle-evento', { evento: e })}
          />
        ))}
      </div>
    </Panel>
  );
}
