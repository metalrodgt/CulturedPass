import { useNavigate } from 'react-router-dom';
import { useGestionEventos } from '../../controllers/useGestionEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import TarjetaEvento from '../components/TarjetaEvento.jsx';
import Icono from '../components/Icono.jsx';

export default function GestionEventos() {
  const navigate = useNavigate();
  const { abrirModal } = useModal();
  const { eventos, cargando, error } = useGestionEventos();

  return (
    <Panel titulo="Administrar eventos">
      <div className="panel__acciones">
        <button type="button" className="boton" onClick={() => abrirModal('crear-evento')}>
          <Icono nombre="add" /> Crear evento
        </button>
      </div>

      {cargando && <Mensaje tipo="cargando">Cargando eventos…</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}
      {!cargando && !error && eventos.length === 0 && <Mensaje>Aún no hay eventos creados.</Mensaje>}

      <div className="tarjetas">
        {eventos.map((e) => (
          <TarjetaEvento
            key={e.id_evento}
            evento={e}
            variante="gestion"
            onEditar={() => abrirModal('editar-evento', { evento: e })}
            onAsistencia={() => navigate(`/gestion/eventos/${e.id_evento}/asistencia`)}
            onEliminar={() => abrirModal('eliminar-evento', { evento: e })}
          />
        ))}
      </div>
    </Panel>
  );
}
