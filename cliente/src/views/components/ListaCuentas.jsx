import { useState } from 'react';
import { useAuth } from '../../controllers/AuthContext.jsx';
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

// Lista de cuentas con buscador y filtro. tipo: 'organizador' | 'visitante'
export default function ListaCuentas({ tipo }) {
  const { usuario } = useAuth();
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { cuentas, cargando, error } = useListaCuentas(tipo);
  const { visibles, busqueda, setBusqueda, aprobacion: filtro, setAprobacion: setFiltro } = useFiltroCuentas(cuentas);
  const { aprobacion } = useAccionesCuenta(tipo);
  const [procesando, setProcesando] = useState(null);

  const esVisitantes = tipo === 'visitante';

  // Los visitantes los gestiona cualquier organizador; para los organizadores el servidor
  // indica qué puede hacer cada uno (regla 9): puede_editar / puede_gestionar.
  const puedeEditar = (c) => (esVisitantes ? true : c.puede_editar);
  const puedeGestionar = (c) => (esVisitantes ? true : c.puede_gestionar);

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
        <MenuFiltro opciones={FILTROS_APROBACION} valor={filtro} onCambiar={setFiltro} clase="boton--amarillo" />
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
        const esPropia = tipo === 'organizador' && id === usuario?.id_organizador;
        return (
          <article key={`${tipo}-${id}`} className="fila fila--cuenta">
            <div className="dato dato--id">
              <span className="dato__titulo">ID</span>
              <span className="dato__valor">{id}</span>
            </div>
            <div className="dato dato--nombre">
              <span className="dato__titulo">Nombre</span>
              <span className="dato__valor">
                {c.nombre}
                {c.administrador && <span className="insignia">{esPropia ? 'Tu cuenta · Admin' : 'Admin'}</span>}
                {!c.administrador && esPropia && <span className="insignia">Tu cuenta</span>}
              </span>
            </div>
            <div className="dato dato--gmail">
              <span className="dato__titulo">Gmail</span>
              <span className="dato__valor">{c.gmail}</span>
            </div>
            <div className="dato dato--dni">
              <span className="dato__titulo">DNI</span>
              <span className="dato__valor">{c.dni ?? '—'}</span>
            </div>
            <div className="dato dato--tel">
              <span className="dato__titulo">Teléfono</span>
              <span className="dato__valor">{c.numero_tel}</span>
            </div>
            <div className="dato dato--aprob">
              <span className="dato__titulo">Aprobación</span>
              <button
                type="button"
                className={`boton boton--chico ${c.aprobacion ? 'boton--verde' : 'boton--rojo'}`}
                onClick={() => alternarAprobacion(c)}
                disabled={!puedeGestionar(c) || procesando === id}
                title={puedeGestionar(c) ? 'Clic para autorizar o deshabilitar' : 'No tienes permiso para cambiar la aprobación de esta cuenta'}
              >
                {c.aprobacion ? 'True' : 'False'}
              </button>
            </div>
            <div className="fila__acciones">
              <button
                type="button"
                className="icono-boton"
                onClick={() => abrirModal('editar-cuenta', { cuenta: c, tipo })}
                disabled={!puedeEditar(c)}
                aria-label={`Editar a ${c.nombre}`}
                title={puedeEditar(c) ? 'Editar' : 'No tienes permiso para editar esta cuenta'}
              >
                <Icono nombre="edit" />
              </button>
              <button
                type="button"
                className="icono-boton icono-boton--peligro"
                onClick={() => abrirModal('eliminar-cuenta', { cuenta: c, tipo })}
                disabled={!puedeGestionar(c)}
                aria-label={`Eliminar a ${c.nombre}`}
                title={puedeGestionar(c) ? 'Eliminar' : 'No tienes permiso para eliminar esta cuenta'}
              >
                <Icono nombre="delete" />
              </button>
            </div>
          </article>
        );
      })}
    </>
  );
}