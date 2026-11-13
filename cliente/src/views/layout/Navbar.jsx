import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../controllers/AuthContext.jsx';
import { useModal } from '../../controllers/ModalContext.jsx';
import Icono from '../components/Icono.jsx';
import LogoCirculo from '../components/LogoCirculo.jsx';

const claseEnlace = ({ isActive }) => `navbar__enlace ${isActive ? 'activo' : ''}`;

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const { abrirModal, mostrarAviso } = useModal();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // El menú del celular se cierra al cambiar de pantalla
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  const buscar = (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    navigate(q ? `/eventos?buscar=${encodeURIComponent(q)}` : '/eventos');
    setAbierto(false);
  };

  const abrir = (nombre) => () => {
    setAbierto(false);
    abrirModal(nombre);
  };

  const salir = async () => {
    setAbierto(false);
    await cerrarSesion();
    navigate('/');
    mostrarAviso('Sesión cerrada');
  };

  return (
    <header className="navbar">
      <div className="navbar__barra">
        <Link to="/" className="navbar__marca" aria-label="CulturedPass - Inicio">
          <LogoCirculo tam={48} />
          <span className="navbar__nombre">CulturedPass</span>
        </Link>

        <button
          type="button"
          className="navbar__hamburguesa"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          aria-controls="menu-principal"
          onClick={() => setAbierto((a) => !a)}
        >
          <Icono nombre={abierto ? 'close' : 'menu'} />
        </button>

        <nav id="menu-principal" className={`navbar__menu ${abierto ? 'abierto' : ''}`}>
          <form className="buscador" role="search" onSubmit={buscar}>
            <button type="submit" className="buscador__boton" aria-label="Buscar evento">
              <Icono nombre="search" />
            </button>
            <input
              type="search"
              className="buscador__entrada"
              placeholder="buscar evento..."
              aria-label="Buscar evento"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              maxLength={100}
            />
          </form>

          <NavLink to="/eventos" className={claseEnlace}>
            Eventos
          </NavLink>

          {/* Regla 23: los organizadores también pueden inscribirse, por eso también ven "Cancelar inscripción" */}
          <button type="button" className="navbar__enlace" onClick={abrir('cancelar')}>
            Cancelar inscripción
          </button>

          {!usuario && (
            <>
              <div className="navbar__sesion">
                <button type="button" className="navbar__enlace" onClick={abrir('login')}>
                  Login
                </button>
                <button type="button" className="navbar__enlace" onClick={abrir('registro')}>
                  Registrarse
                </button>
              </div>
            </>
          )}

          {usuario && (
            <>
              <button type="button" className="navbar__enlace" onClick={abrir('crear-evento')}>
                Crear
              </button>
              <NavLink to="/gestion/eventos" className={claseEnlace}>
                Administrar
              </NavLink>
              <NavLink to="/gestion/cuentas" className={claseEnlace}>
                Cuentas
              </NavLink>
              {usuario.administrador && (
                <button type="button" className="navbar__enlace" onClick={abrir('clave-registro')}>
                  Clave
                </button>
              )}
              <div className="navbar__sesion">
                <button type="button" className="navbar__enlace navbar__enlace--chico" onClick={salir}>
                  Cerrar sesión
                </button>
                <span className="navbar__usuario" title={usuario.gmail}>
                  <Icono nombre="account_circle" className="navbar__avatar" />
                  <span className="navbar__usuario-nombre">{usuario.nombre}</span>
                </span>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
