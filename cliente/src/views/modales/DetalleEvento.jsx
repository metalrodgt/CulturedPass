import { useEffect, useState } from 'react';
import { eventosApi } from '../../models/api/eventosApi.js';
import { fechaLegible } from '../../models/formato.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import ModalBase from './ModalBase.jsx';
import BotonCerrar from '../components/BotonCerrar.jsx';
import ImagenPortada from '../components/ImagenPortada.jsx';

export default function DetalleEvento({ evento: inicial, onCerrar }) {
  const { abrirModal } = useModal();
  const [evento, setEvento] = useState(inicial);

  // Se pide el evento actualizado para mostrar el cupo real
  useEffect(() => {
    let activo = true;
    eventosApi
      .obtener(inicial.id_evento)
      .then((r) => activo && setEvento(r.evento))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [inicial.id_evento]);

  const finalizado = evento.estado === 'Finalizado';
  const agotado = !finalizado && evento.cupo_disponible <= 0;

  return (
    <ModalBase onCerrar={onCerrar} ancho="grande" etiqueta={`Detalle de ${evento.nombre_evento}`}>
      <BotonCerrar onClick={onCerrar} />
      <h2 className="modal__titulo modal__titulo--chico">{evento.nombre_evento}</h2>

      <div className="detalle__imagen">
        <ImagenPortada src={evento.portada} alt={`Portada de ${evento.nombre_evento}`} />
      </div>

      <h3 className="modal__subtitulo">Descripción</h3>
      <p className="detalle__descripcion">{evento.descripcion}</p>
      <hr className="separador" />

      <dl className="detalle__datos">
        <div><dt>Encargado:</dt><dd>{evento.nombre_encargado}</dd></div>
        <div><dt>Teléfono:</dt><dd>{evento.numero_telefono}</dd></div>
        <div><dt>Ubicación:</dt><dd>{evento.ubicacion}</dd></div>
        <div><dt>Fecha:</dt><dd>{fechaLegible(evento.fecha_evento)}</dd></div>
        <div><dt>Hora de inicio:</dt><dd>{evento.hora_inicio}</dd></div>
        <div><dt>Hora de finalización:</dt><dd>{evento.hora_finalizacion}</dd></div>
        <div><dt>Cupo:</dt><dd>{evento.cupo_disponible}/{evento.cupo_total}</dd></div>
      </dl>

      <div className="modal__acciones">
        {finalizado ? (
          <span className="etiqueta etiqueta--apagada">Evento finalizado</span>
        ) : (
          <button
            type="button"
            className="boton boton--grande"
            disabled={agotado}
            onClick={() => abrirModal('inscripcion', { evento })}
          >
            {agotado ? 'Cupo agotado' : 'Inscribirse'}
          </button>
        )}
      </div>
    </ModalBase>
  );
}
