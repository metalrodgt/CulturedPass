import { useState } from 'react';
import {
  hayErrores,
  validarTelefono,
  validarTexto,
  validarUrl,
} from '../../models/validaciones.js';
import { hoyISO, sumarDia } from '../../models/formato.js';
import Campo from '../components/Campo.jsx';
import ImagenPortada from '../components/ImagenPortada.jsx';

const VACIO = {
  nombre_evento: '',
  nombre_encargado: '',
  numero_telefono: '',
  fecha_evento: '',
  fecha_final: '',
  ubicacion: '',
  hora_inicio: '',
  hora_finalizacion: '',
  descripcion: '',
  portada: '',
  cupo_total: '',
};

// Formulario compartido por "Crear evento" y "Editar evento"
export default function FormularioEvento({ evento, onEnviar, onCancelar, cargando, error, textoBoton }) {
  const editando = Boolean(evento);
  const inscriptos = editando ? evento.inscriptos : 0;

  const [valores, setValores] = useState(
    editando
      ? {
          nombre_evento: evento.nombre_evento,
          nombre_encargado: evento.nombre_encargado,
          numero_telefono: evento.numero_telefono,
          fecha_evento: evento.fecha_evento,
          fecha_final: evento.fecha_final ?? '',
          ubicacion: evento.ubicacion,
          hora_inicio: evento.hora_inicio,
          hora_finalizacion: evento.hora_finalizacion,
          descripcion: evento.descripcion,
          portada: evento.portada,
          cupo_total: String(evento.cupo_total),
        }
      : VACIO,
  );
  const [errores, setErrores] = useState({});
  const cambiar = (campo) => (e) => setValores((v) => ({ ...v, [campo]: e.target.value }));

  // Si ya había fecha final y se cambia la fecha del evento, la fecha final se ajusta al día siguiente
  const cambiarFecha = (e) => {
    const fecha = e.target.value;
    setValores((v) => ({
      ...v,
      fecha_evento: fecha,
      fecha_final: v.fecha_final && fecha ? sumarDia(fecha) : '',
    }));
  };

  const validar = () => {
    const e = {
      nombre_evento: validarTexto(valores.nombre_evento, 'El nombre del evento', 150),
      nombre_encargado: validarTexto(valores.nombre_encargado, 'El nombre del encargado', 100),
      numero_telefono: validarTelefono(valores.numero_telefono),
      ubicacion: validarTexto(valores.ubicacion, 'La ubicación', 200),
      descripcion: validarTexto(valores.descripcion, 'La descripción', 5000),
      portada: validarUrl(valores.portada),
      fecha_evento: '',
      fecha_final: '',
      hora_inicio: valores.hora_inicio ? '' : 'La hora de inicio es obligatoria',
      hora_finalizacion: valores.hora_finalizacion ? '' : 'La hora de finalización es obligatoria',
      cupo_total: '',
    };

    // Regla 16: no puede ser una fecha pasada (al editar, solo si se cambió la fecha)
    if (!valores.fecha_evento) e.fecha_evento = 'La fecha es obligatoria';
    else if ((!editando || valores.fecha_evento !== evento.fecha_evento) && valores.fecha_evento < hoyISO()) {
      e.fecha_evento = 'La fecha no puede ser pasada';
    }

    // Regla 11: con fecha final la hora de fin puede ser menor a la de inicio (corresponde al día siguiente)
    if (valores.fecha_final) {
      if (!valores.fecha_evento || valores.fecha_final !== sumarDia(valores.fecha_evento)) {
        e.fecha_final = 'La fecha final solo puede ser el día siguiente a la fecha del evento';
      }
    } else if (!e.hora_inicio && !e.hora_finalizacion && valores.hora_finalizacion <= valores.hora_inicio) {
      e.hora_finalizacion = 'La hora de finalización debe ser posterior a la de inicio (o agrega una fecha final)';
    }

    // Regla 15
    const cupo = Number(valores.cupo_total);
    if (!valores.cupo_total || !Number.isInteger(cupo) || cupo < 1) e.cupo_total = 'Ingresa un número entero mayor a 0';
    else if (cupo > 100000) e.cupo_total = 'El cupo es demasiado grande';
    else if (editando && cupo < inscriptos) e.cupo_total = `No puede ser menor a los ya inscriptos (${inscriptos})`;
    return e;
  };

  const enviar = (ev) => {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (hayErrores(nuevos)) return;
    onEnviar({
      nombre_evento: valores.nombre_evento.trim(),
      nombre_encargado: valores.nombre_encargado.trim(),
      numero_telefono: valores.numero_telefono.trim(),
      fecha_evento: valores.fecha_evento,
      fecha_final: valores.fecha_final || null,
      ubicacion: valores.ubicacion.trim(),
      hora_inicio: valores.hora_inicio,
      hora_finalizacion: valores.hora_finalizacion,
      descripcion: valores.descripcion.trim(),
      portada: valores.portada.trim(),
      cupo_total: Number(valores.cupo_total),
    });
  };

  const inv = (c) => Boolean(errores[c]);

  return (
    <form onSubmit={enviar} noValidate>
      <Campo etiqueta="Nombre del evento:" id="ev-nombre" error={errores.nombre_evento}>
        <input id="ev-nombre" className="entrada" value={valores.nombre_evento} onChange={cambiar('nombre_evento')} maxLength={150} autoFocus aria-invalid={inv('nombre_evento')} />
      </Campo>
      <Campo etiqueta="Nombre encargado:" id="ev-enc" error={errores.nombre_encargado}>
        <input id="ev-enc" className="entrada" value={valores.nombre_encargado} onChange={cambiar('nombre_encargado')} maxLength={100} aria-invalid={inv('nombre_encargado')} />
      </Campo>
      <Campo etiqueta="Número de teléfono:" id="ev-tel" error={errores.numero_telefono}>
        <input id="ev-tel" type="tel" className="entrada" value={valores.numero_telefono} onChange={cambiar('numero_telefono')} maxLength={20} inputMode="tel" aria-invalid={inv('numero_telefono')} />
      </Campo>
      <Campo etiqueta="Fecha:" id="ev-fecha" error={errores.fecha_evento}>
        <input id="ev-fecha" type="date" className="entrada" value={valores.fecha_evento} onChange={cambiarFecha} min={editando ? undefined : hoyISO()} aria-invalid={inv('fecha_evento')} />
      </Campo>
      <Campo etiqueta="Ubicación:" id="ev-ubi" error={errores.ubicacion}>
        <input id="ev-ubi" className="entrada" value={valores.ubicacion} onChange={cambiar('ubicacion')} maxLength={200} aria-invalid={inv('ubicacion')} />
      </Campo>
      <Campo etiqueta="Hora de inicio:" id="ev-hi" error={errores.hora_inicio}>
        <input id="ev-hi" type="time" className="entrada" value={valores.hora_inicio} onChange={cambiar('hora_inicio')} aria-invalid={inv('hora_inicio')} />
      </Campo>
      <Campo etiqueta="Hora de finalización:" id="ev-hf" error={errores.hora_finalizacion}>
        <input id="ev-hf" type="time" className="entrada" value={valores.hora_finalizacion} onChange={cambiar('hora_finalizacion')} aria-invalid={inv('hora_finalizacion')} />
      </Campo>
      <Campo
        etiqueta="Fecha final (opcional):"
        id="ev-ff"
        error={errores.fecha_final}
        ayuda="Solo si el evento termina al día siguiente. Con fecha final, la hora de finalización puede ser menor a la de inicio."
      >
        <div className="fecha-final">
          <input
            id="ev-ff"
            type="date"
            className="entrada"
            value={valores.fecha_final}
            onChange={cambiar('fecha_final')}
            disabled={!valores.fecha_evento}
            min={valores.fecha_evento ? sumarDia(valores.fecha_evento) : undefined}
            max={valores.fecha_evento ? sumarDia(valores.fecha_evento) : undefined}
            aria-invalid={inv('fecha_final')}
          />
          {valores.fecha_final && (
            <button type="button" className="boton boton--chico" onClick={() => setValores((v) => ({ ...v, fecha_final: '' }))}>
              Quitar
            </button>
          )}
        </div>
      </Campo>
      <Campo etiqueta="Descripción:" id="ev-desc" error={errores.descripcion}>
        <textarea id="ev-desc" className="entrada" rows={4} value={valores.descripcion} onChange={cambiar('descripcion')} maxLength={5000} aria-invalid={inv('descripcion')} />
      </Campo>
      <Campo etiqueta="Portada (URL):" id="ev-portada" error={errores.portada} ayuda="Enlace a una imagen (https://…)">
        <input id="ev-portada" type="url" className="entrada" value={valores.portada} onChange={cambiar('portada')} maxLength={500} inputMode="url" placeholder="https://" aria-invalid={inv('portada')} />
        {valores.portada.trim() && !errores.portada && (
          <div className="formulario__vista-previa">
            <ImagenPortada src={valores.portada.trim()} alt="Vista previa de la portada" />
          </div>
        )}
      </Campo>
      <Campo
        etiqueta="Cupos totales:"
        id="ev-cupo"
        error={errores.cupo_total}
        ayuda={editando ? `Ya inscriptos: ${inscriptos}. No puedes bajar el cupo por debajo de esa cantidad.` : undefined}
      >
        <input id="ev-cupo" type="number" className="entrada" value={valores.cupo_total} onChange={cambiar('cupo_total')} min={editando ? Math.max(1, inscriptos) : 1} max={100000} inputMode="numeric" aria-invalid={inv('cupo_total')} />
      </Campo>

      {editando && (
        <>
          <Campo etiqueta="Estado:" id="ev-estado">
            <input id="ev-estado" className="entrada" value={evento.estado} readOnly />
          </Campo>
          {/* Regla 13: el id del organizador creador solo se muestra, no se edita */}
          <Campo etiqueta="ID organizador:" id="ev-org">
            <span className="entrada entrada--insignia" id="ev-org" title={evento.organizador?.nombre ?? ''}>
              {evento.id_organizador}
            </span>
          </Campo>
        </>
      )}

      {error && <p className="modal__error" role="alert">{error}</p>}

      <div className="modal__acciones">
        <button type="submit" className="boton" disabled={cargando}>
          {cargando ? 'Guardando…' : textoBoton}
        </button>
        <button type="button" className="boton" onClick={onCancelar}>
          Descartar
        </button>
      </div>
    </form>
  );
}
