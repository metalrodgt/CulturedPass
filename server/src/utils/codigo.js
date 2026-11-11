import { randomInt } from 'node:crypto';

// 8 caracteres A-Z / 0-9 (cumple el CHECK de la BD). Se omiten 0, O, 1, I
// para evitar confusiones cuando el organizador lee el código en voz alta.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const REGEX_CODIGO = /^[A-Z0-9]{8}$/;

export const generarCodigo = () => {
  let codigo = '';
  for (let i = 0; i < 8; i += 1) codigo += ALFABETO[randomInt(ALFABETO.length)];
  return codigo;
};
