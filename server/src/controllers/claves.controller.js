import { asyncHandler } from '../utils/asyncHandler.js';
import { guardarClaves, obtenerClaves } from '../services/claves.service.js';

// Solo un administrador llega hasta aquí (ver gestion.routes.js)
export const verClaves = asyncHandler(async (req, res) => {
  res.json(await obtenerClaves());
});

export const cambiarClaves = asyncHandler(async (req, res) => {
  await guardarClaves(req.body);
  res.json({ mensaje: 'Claves actualizadas', ...(await obtenerClaves()) });
});
