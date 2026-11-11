// Ícono de Google Fonts (Material Symbols). Ver el listado en https://fonts.google.com/icons
export default function Icono({ nombre, className = '', ...resto }) {
  return (
    <span className={`material-symbols-rounded ${className}`} aria-hidden="true" {...resto}>
      {nombre}
    </span>
  );
}
