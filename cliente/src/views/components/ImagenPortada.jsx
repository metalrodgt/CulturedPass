import { useEffect, useState } from 'react';
import Icono from './Icono.jsx';

// Muestra la portada; si la URL falla o no existe, muestra un recuadro con el ícono de teatro
export default function ImagenPortada({ src, alt, className = '' }) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => {
    setFallo(false);
  }, [src]);

  if (!src || fallo) {
    return (
      <div className={`imagen-vacia ${className}`} role="img" aria-label="Sin imagen">
        <Icono nombre="theater_comedy" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFallo(true)}
    />
  );
}
