import { fechaLegible } from '../../models/formato.js';
import ImagenPortada from './ImagenPortada.jsx';
import Icono from './Icono.jsx';

// Tarjeta de evento con tres variantes:
//  - 'disponible': sección Eventos
//  - 'finalizado': página principal (publicidad de eventos pasados)
//  - 'gestion'   : panel del organizador (editar / asistencia / eliminar)
export default function TarjetaEvento({ evento, variante = 'disponible', onVerMas, onEditar, onAsistencia, onEliminar }) {
  const finalizado = evento.estado === 'Finalizado';
  const agotado = !finalizado && evento.cupo_disponible <= 0;
  const claseEstado = finalizado ? 'etiqueta--apagada' : agotado ? 'etiqueta--agotado' : '';
  const textoEstado = finalizado ? 'Finalizado' : agotado ? 'Agotado' : 'Disponible';

  // Si el evento termina al día siguiente se aclara cuál es ese día (ej. "02:00 (18/11)")
  const horario = `${evento.hora_inicio} - ${evento.hora_finalizacion}${
    evento.fecha_final ? ` (${fechaLegible(evento.fecha_final).slice(0, 5)})` : ''
  }`;

  return (
    <article className="tarjeta">
      <div className="tarjeta__imagen">
        <ImagenPortada src={evento.portada} alt={`Portada de ${evento.nombre_evento}`} />
      </div>

      <span className={`etiqueta tarjeta__estado ${claseEstado}`}>{textoEstado}</span>

      <div className="tarjeta__cuerpo">
        <h3 className="tarjeta__titulo">{evento.nombre_evento}</h3>
        <p className="tarjeta__descripcion">{evento.descripcion}</p>
        <hr className="separador" />
        <p className="tarjeta__meta">
          <span>
            <Icono nombre="event" /> {fechaLegible(evento.fecha_evento)}
          </span>
          <span>
            <Icono nombre="schedule" /> {horario}
          </span>
        </p>
        <p className="tarjeta__datos">
          <span>Encargado: {evento.nombre_encargado}</span>
          <span>Ubicación: {evento.ubicacion}</span>
        </p>
      </div>

      <div className="tarjeta__pie">
        {variante === 'disponible' && (
          <>
            <span className="tarjeta__texto">
              Cupos disponibles: {evento.cupo_disponible}/{evento.cupo_total}
            </span>
            <button type="button" className="boton boton--verde" onClick={onVerMas}>
              Ver más
            </button>
          </>
        )}

        {variante === 'finalizado' && (
          <button type="button" className="boton boton--enlace boton--claro" onClick={onVerMas}>
            Ver más
          </button>
        )}

        {variante === 'gestion' && (
          <>
            <span className="tarjeta__texto tarjeta__texto--completo">
              Inscriptos: {evento.inscriptos}/{evento.cupo_total}
            </span>
            <div className="tarjeta__acciones">
              <button
                type="button"
                className="boton"
                onClick={onEditar}
                disabled={finalizado}
                title={finalizado ? 'No se pueden editar eventos finalizados' : 'Editar evento'}
              >
                Editar
              </button>
              <button type="button" className="boton" onClick={onAsistencia}>
                Asistencia
              </button>
              <button type="button" className="boton" onClick={onEliminar}>
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
