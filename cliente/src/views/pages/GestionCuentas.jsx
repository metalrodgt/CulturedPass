import { useState } from 'react';
import { useAuth } from '../../controllers/AuthContext.jsx';
import {
  FILTROS_APROBACION,
  useAccionesCuenta,
  useCuentas,
  useFiltroCuentas,
} from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import MenuFiltro from '../components/MenuFiltro.jsx';
import Icono from '../components/Icono.jsx';

export default function GestionCuentas() {
  const { usuario } = useAuth();
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { cuentas, cargando, error } = useCuentas();
  const { visibles, busqueda, setBusqueda, aprobacion: filtro, setAprobacion: setFiltro } = useFiltroCuentas(cuentas);
  const { aprobacion } = useAccionesCuenta();
  const [procesando, setProcesando] = useState(null);

  // Habilitar / deshabilitar (reglas 8, 9 y 10)
  const alternarAprobacion = async (cuenta) => {
    setProcesando(cuenta.id_organizador);
    const r = await aprobacion(cuenta.id_organizador, !cuenta.aprobacion);
    setProcesando(null);
    if (r.ok) {
      refrescarDatos();
      mostrarAviso(r.datos.mensaje);
    } else {
      mostrarAviso(r.error.message, 'error');
    }
  };

  return (
    <Panel titulo="Gestionar cuentas" ancho>
      {cargando && <Mensaje tipo="cargando">Cargando cuentas…</Mensaje>}
      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {!cargando && !error && (
        <div className="contenedor-vino">
          <div className="barra-cuentas">
            <div className="buscador buscador--claro">
              <Icono nombre="search" />
              <input
                type="search"
                className="buscador__entrada"
                placeholder="buscar por id, nombre o gmail..."
                aria-label="Buscar cuenta por id, nombre o gmail"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                maxLength={100}
              />
            </div>
            <MenuFiltro opciones={FILTROS_APROBACION} valor={filtro} onCambiar={setFiltro} clase="boton--amarillo" />
          </div>

          {visibles.length === 0 && (
            <p className="mensaje mensaje--claro">
              {cuentas.length === 0 ? 'No hay otras cuentas registradas.' : 'Ninguna cuenta coincide con la búsqueda o el filtro.'}
            </p>
          )}

          {visibles.map((c) => (
            <article key={c.id_organizador} className="fila fila--cuenta">
              <div className="dato dato--id">
                <span className="dato__titulo">ID</span>
                <span className="dato__valor">{c.id_organizador}</span>
              </div>
              <div className="dato dato--nombre">
                <span className="dato__titulo">Nombre</span>
                <span className="dato__valor">
                  {c.nombre}
                  {c.administrador && (
                    <span className="insignia">{c.id_organizador === usuario?.id_organizador ? 'Tu cuenta · Admin' : 'Admin'}</span>
                  )}
                </span>
              </div>
              <div className="dato dato--gmail">
                <span className="dato__titulo">Gmail</span>
                <span className="dato__valor">{c.gmail}</span>
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
                  disabled={!c.puede_gestionar || procesando === c.id_organizador}
                  title={c.puede_gestionar ? 'Clic para cambiar la aprobación' : 'Las cuentas de administrador no se pueden deshabilitar'}
                >
                  {c.aprobacion ? 'True' : 'False'}
                </button>
              </div>
              <div className="fila__acciones">
                <button
                  type="button"
                  className="icono-boton"
                  onClick={() => abrirModal('editar-cuenta', { cuenta: c })}
                  disabled={!c.puede_editar}
                  aria-label={`Editar a ${c.nombre}`}
                  title={c.puede_editar ? 'Editar' : 'No se puede editar a otro administrador'}
                >
                  <Icono nombre="edit" />
                </button>
                <button
                  type="button"
                  className="icono-boton icono-boton--peligro"
                  onClick={() => abrirModal('eliminar-cuenta', { cuenta: c })}
                  disabled={!c.puede_gestionar}
                  aria-label={`Eliminar a ${c.nombre}`}
                  title={c.puede_gestionar ? 'Eliminar' : 'Las cuentas de administrador no se pueden eliminar'}
                >
                  <Icono nombre="delete" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}
