// Error "esperado" con código HTTP y mensaje seguro para mostrar al cliente.
export class AppError extends Error {
  constructor(status, mensaje, datos = {}) {
    super(mensaje);
    this.status = status;
    this.datos = datos;
  }
}
