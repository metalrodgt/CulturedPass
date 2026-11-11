import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { normalizar } from '../../models/formato.js';
import { useEventosDisponibles } from '../../controllers/useEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import TarjetaEvento from '../components/TarjetaEvento.jsx';
import Icono from '../components/Icono.jsx';

export default function Eventos() {
  const [params, setParams] = useSearchParams();
  const buscar = (params.get('buscar') ?? '').trim();
  const { eventos, cargando, error } = useEventosDisponibles();
  const { abrirModal } = useModal();

  const filtrados = useMemo(() => {
    if (!buscar) return eventos;
    const t = normalizar(buscar);
    return eventos.filter((e) =>
      normalizar(`${e.nombre_evento} ${e.descripcion} ${e.nombre_encargado} ${e.ubicacion}`).includes(t),
    );
  }, [eventos, buscar]);

  return (
    <Panel titulo="Eventos disponibles">
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
        <Mensaje>{buscar ? 'No encontramos eventos con esa búsqueda.' : 'No hay eventos disponibles por ahora.'}</Mensaje>
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
