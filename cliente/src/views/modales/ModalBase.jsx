import { useEffect } from 'react';
import LogoCirculo from '../components/LogoCirculo.jsx';

// Estructura común de todas las ventanas modales
// - Esc y clic fuera cierran (salvo que bloquear = true)
// - Evita que la página de atrás se desplace
export default function ModalBase({ children, onCerrar, bloquear = false, conLogo = false, ancho = 'normal', etiqueta }) {
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alTeclear = (e) => {
      if (e.key === 'Escape' && !bloquear && onCerrar) onCerrar();
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [bloquear, onCerrar]);

  return (
    <div
      className="modal-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloquear && onCerrar) onCerrar();
      }}
    >
      <div className={`modal modal--${ancho}`} role="dialog" aria-modal="true" aria-label={etiqueta}>
        {conLogo && <LogoCirculo tam={68} className="modal__logo" />}
        {children}
      </div>
    </div>
  );
}
