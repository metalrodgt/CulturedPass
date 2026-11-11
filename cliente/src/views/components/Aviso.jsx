import { useEffect } from 'react';
import { useModal } from '../../controllers/ModalContext.jsx';
import LogoCirculo from './LogoCirculo.jsx';

// Tarjeta de confirmación ("evento eliminado correctamente", etc.). Se cierra sola.
export default function Aviso() {
  const { aviso, ocultarAviso } = useModal();

  useEffect(() => {
    if (!aviso) return undefined;
    const duracion = Math.max(3000, aviso.texto.length * 55);
    const t = setTimeout(ocultarAviso, duracion);
    return () => clearTimeout(t);
  }, [aviso, ocultarAviso]);

  if (!aviso) return null;
  return (
    <div
      className={`aviso aviso--${aviso.tipo}`}
      role={aviso.tipo === 'error' ? 'alert' : 'status'}
      onClick={ocultarAviso}
    >
      <LogoCirculo tam={52} className="aviso__logo" />
      <p className="aviso__texto">{aviso.texto}</p>
    </div>
  );
}
