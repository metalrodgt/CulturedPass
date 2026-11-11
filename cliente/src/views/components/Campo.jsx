// Etiqueta + control + error de un formulario
export default function Campo({ etiqueta, id, error, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
      </label>
      <div className="campo__control">
        {children}
        {ayuda && <small className="campo__ayuda">{ayuda}</small>}
        {error && (
          <span className="campo__error" role="alert">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
