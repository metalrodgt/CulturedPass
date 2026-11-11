import { useState } from 'react';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useAccionesCuenta, useCuentas } from '../../controllers/useCuentas.js';
import { useModal } from '../../controllers/ModalContext.jsx';
import Panel from '../components/Panel.jsx';
import Mensaje from '../components/Mensaje.jsx';
import Icono from '../components/Icono.jsx';

export default function GestionCuentas() {
  const { usuario } = useAuth();
  const { abrirModal, mostrarAviso, refrescarDatos } = useModal();
  const { cuentas, cargando, error } = useCuentas();
  const { aprobacion } = useAccionesCuenta();
  const [procesando, setProcesando] = useState(null);

  // Habilitar / deshabilitar (regla 8 y 10)
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
      {!cargando && !error && cuentas.length === 0 && <Mensaje>No hay otras cuentas registradas.</Mensaje>}

      {cuentas.length > 0 && (
        <div className="contenedor-vino">
          {cuentas.map((c) => {
            const esPropia = c.id_organizador === usuario?.id_organizador;
            return (
              <article key={c.id_organizador} className="fila fila--cuenta">
                <Icono nombre="account_circle" className="fila__avatar" />
                <div className="dato dato--nombre">
                  <span className="dato__titulo">Nombre</span>
                  <span className="dato__valor">
                    {c.nombre}
                    {c.administrador && <span className="insignia">{esPropia ? 'Tu cuenta · Admin' : 'Admin'}</span>}
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
                    disabled={c.protegida || procesando === c.id_organizador}
                    title={c.protegida ? 'Las cuentas de administrador no se pueden deshabilitar' : 'Clic para cambiar la aprobación'}
                  >
                    {c.aprobacion ? 'True' : 'False'}
                  </button>
                </div>
                <div className="fila__acciones">
                  <button
                    type="button"
                    className="icono-boton"
                    onClick={() => abrirModal('editar-cuenta', { cuenta: c })}
                    disabled={c.protegida}
                    aria-label={`Editar a ${c.nombre}`}
                    title="Editar"
                  >
                    <Icono nombre="edit" />
                  </button>
                  <button
                    type="button"
                    className="icono-boton icono-boton--peligro"
                    onClick={() => abrirModal('eliminar-cuenta', { cuenta: c })}
                    disabled={c.protegida}
                    aria-label={`Eliminar a ${c.nombre}`}
                    title="Eliminar"
                  >
                    <Icono nombre="delete" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
