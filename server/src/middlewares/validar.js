// Valida body / params / query con un esquema de Zod.
// Reemplaza el dato original por el ya validado y limpio (se descartan campos desconocidos).
export const validar = (schema, origen = 'body') => (req, res, next) => {
  const resultado = schema.safeParse(req[origen]);
  if (!resultado.success) {
    const errores = resultado.error.issues.map((i) => ({
      campo: i.path.join('.'),
      mensaje: i.message,
    }));
    return res.status(400).json({ mensaje: errores[0].mensaje, errores });
  }
  req[origen] = resultado.data;
  return next();
};
