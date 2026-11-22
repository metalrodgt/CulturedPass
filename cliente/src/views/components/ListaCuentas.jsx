import { useState } from 'react';
import {
  FILTROS_APROBACION,
  idDeCuenta,
  useAccionesCuenta,
  useFiltroCuentas,
  useListaCuentas,
} from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Mensaje from './Mensaje.jsx';
import MenuFiltro from './MenuFiltro.jsx';
import Icono from './Icono.jsx';

// Lista de cuentas con buscador (y filtro de autorización solo para organizadores).
// tipo: 'organizador' | 'visitante'
export default function ListaCuentas({ tipo }) {
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { cuentas, cargando, error } = useListaCuentas(tipo);
  const { visibles, busqueda, setBusqueda, aprobacion: filtro, setAprobacion: setFiltro } = useFiltroCuentas(cuentas);
  const { aprobacion } = useAccionesCuenta(tipo);
  const [procesando, setProcesando] = useState(null);

  const esVisitantes = tipo === 'visitante';

  // El servidor indica qué puede hacer quien consulta con cada cuenta (regla 9).
  // Lo que no puede usar NO se muestra: los botones de editar y eliminar solo los ve el administrador.
  const puedeAutorizar = (c) => Boolean(c.puede_gestionar);
  const puedeEditar = (c) => Boolean(c.puede_editar);
  const puedeEliminar = (c) => Boolean(c.puede_eliminar);

  const alternarAprobacion = async (cuenta) => {
    const id = idDeCuenta(cuenta);
    setProcesando(id);
    const r = await aprobacion(id, !cuenta.aprobacion);
    setProcesando(null);
    if (r.ok) {
      refrescarDatos();
      mostrarAviso(r.datos.mensaje);
    } else {
      mostrarAviso(r.error.message, 'error');
    }
  };

  return (
    <>
      <div className="barra-cuentas">
        <div className="buscador buscador--claro">
          <Icono nombre="search" />
          <input
            type="search"
            className="buscador__entrada"
            placeholder="buscar por id, nombre, gmail o dni..."
            aria-label="Buscar cuenta por id, nombre, gmail o DNI"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={100}
          />
        </div>
        <h3 className="barra-cuentas__titulo">{esVisitantes ? 'VISITANTES' : 'ORGANIZADORES'}</h3>
        {/* Los visitantes no necesitan autorización: el filtro solo tiene sentido con organizadores */}
        {!esVisitantes && (
          <MenuFiltro opciones={FILTROS_APROBACION} valor={filtro} onCambiar={setFiltro} clase="boton--amarillo" />
        )}
      </div>

      {cargando && <Mensaje tipo="cargando">Cargando cuentas…</Mensaje>}
      {error && <p className="mensaje mensaje--claro" role="alert">{error}</p>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="mensaje mensaje--claro">
          {cuentas.length === 0 ? 'Todavía no hay cuentas registradas.' : 'Ninguna cuenta coincide con la búsqueda o el filtro.'}
        </p>
      )}

      {visibles.map((c) => {
        const id = idDeCuenta(c);
        const claseAprobacion = c.aprobacion ? 'boton--verde' : 'boton--rojo';
        const textoAprobacion = c.aprobacion ? 'Autorizado' : 'Desautorizado';
        const hayAcciones = puedeEditar(c) || puedeEliminar(c);
        return (
          <article key={`${tipo}-${id}`} className={`fila fila--cuenta ${esVisitantes ? 'fila--sin-aprobacion' : ''}`}>
            <div className="dato dato--id">
              <span className="dato__titulo">ID</span>
              <span className="dato__valor">{id}</span>
            </div>
            <div className="dato dato--nombre">
              <span className="dato__titulo">Nombre</span>
              <span className="dato__valor">
                {c.nombre}
                {c.administrador && <span className="insignia">Admin</span>}
              </span>
            </div>
            <div className="dato dato--gmail">
              <span className="dato__titulo">Gmail</span>
              <span className="dato__valor">{c.gmail}</span>
            </div>
            <div className="dato dato--dni">
              <span className="dato__titulo">DNI</span>
              <span className="dato__valor">{c.dni}</span>
            </div>
            <div className="dato dato--tel">
              <span className="dato__titulo">Teléfono</span>
              <span className="dato__valor">{c.numero_tel}</span>
            </div>
            {!esVisitantes && (
              <div className="dato dato--aprob">
                <span className="dato__titulo">Aprobación</span>
                {puedeAutorizar(c) ? (
                  <button
                    type="button"
                    className={`boton boton--chico ${claseAprobacion}`}
                    onClick={() => alternarAprobacion(c)}
                    disabled={procesando === id}
                    title="Clic para autorizar o desautorizar"
                  >
                    {textoAprobacion}
                  </button>
                ) : (
                  // Sin permiso: se muestra solo el estado, sin que parezca un botón
                  <span className={`boton boton--chico estado-fijo ${claseAprobacion}`}>{textoAprobacion}</span>
                )}
              </div>
            )}
            {hayAcciones && (
              <div className="fila__acciones">
                {puedeEditar(c) && (
                  <button
                    type="button"
                    className="icono-boton"
                    onClick={() => abrirModal('editar-cuenta', { cuenta: c, tipo })}
                    aria-label={`Editar a ${c.nombre}`}
                    title="Editar"
                  >
                    <Icono nombre="edit" />
                  </button>
                )}
                {puedeEliminar(c) && (
                  <button
                    type="button"
                    className="icono-boton icono-boton--peligro"
                    onClick={() => abrirModal('eliminar-cuenta', { cuenta: c, tipo })}
                    aria-label={`Eliminar a ${c.nombre}`}
                    title="Eliminar"
                  >
                    <Icono nombre="delete" />
                  </button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}
