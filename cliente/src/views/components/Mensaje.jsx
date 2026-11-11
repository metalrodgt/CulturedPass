// Estados de carga / vacío / error dentro de un panel
export default function Mensaje({ tipo = 'vacio', children }) {
  return (
    <p className={`mensaje mensaje--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}
