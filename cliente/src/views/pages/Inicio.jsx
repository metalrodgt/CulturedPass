import { useNavigate } from 'react-router-dom';
import telon from '../../assets/telon.png';
import { useEventosFinalizados } from '../../controllers/useEventos.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import TarjetaEvento from '../components/TarjetaEvento.jsx';

export default function Inicio() {
  const navigate = useNavigate();
  const { abrirModal } = useModal();
  const { eventos, cargando, error } = useEventosFinalizados();

  const irAFinalizados = () => document.getElementById('finalizados')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <section className="hero" aria-labelledby="titulo-principal">
        <div className="escenario">
          <div className="escenario__fondo" />
          <div className="escenario__contenido">
            <p className="hero__sub">Plataforma de registro a eventos culturales</p>
            <h1 id="titulo-principal" className="hero__titulo">CulturedPass</h1>
            <p className="hero__texto">
              Elígenos para administrar tu evento cultural y artístico.
              <br />
              Lleva la cuenta de las inscripciones y asistencias.
            </p>
            <div className="hero__botones">
              <button type="button" className="boton boton--vino boton--grande" onClick={() => navigate('/eventos')}>
                Ver eventos
              </button>
              <button type="button" className="boton boton--vino boton--grande" onClick={irAFinalizados}>
                Eventos finalizados
              </button>
            </div>
          </div>
          <img className="escenario__telon" src={telon} alt="" aria-hidden="true" />
        </div>
      </section>

      <Panel id="finalizados" titulo="Eventos finalizados">
        {cargando && <Mensaje tipo="cargando">Cargando eventos…</Mensaje>}
        {error && <Mensaje tipo="error">{error}</Mensaje>}
        {!cargando && !error && eventos.length === 0 && (
          <Mensaje>Todavía no hay eventos finalizados.</Mensaje>
        )}
        <div className="tarjetas">
          {eventos.map((e) => (
            <TarjetaEvento
              key={e.id_evento}
              evento={e}
              variante="finalizado"
              onVerMas={() => abrirModal('detalle-evento', { evento: e })}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
