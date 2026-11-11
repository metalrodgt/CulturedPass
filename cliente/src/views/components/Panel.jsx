// Panel gris con título subrayado (contenedor principal de cada sección)
export default function Panel({ id, titulo, ancho = false, children }) {
  return (
    <section id={id} className={`panel ${ancho ? 'panel--ancho' : ''}`}>
      <h2 className="panel__titulo">{titulo}</h2>
      {children}
    </section>
  );
}
