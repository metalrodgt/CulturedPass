import { Router } from 'express';
import { autenticarCuenta } from '../middlewares/auth.js';
import { limiteInscripcion } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { cancelacionSchema, idSchema } from '../validators/schemas.js';
import * as eventos from '../controllers/evento.controller.js';
import * as boletos from '../controllers/boleto.controller.js';

// Rutas que NO requieren cuenta (visitantes) - regla 2
const router = Router();

router.get('/eventos/disponibles', eventos.listarDisponibles);
router.get('/eventos/finalizados', eventos.listarFinalizados);
router.get('/eventos/:id', validar(idSchema, 'params'), eventos.obtenerPublico);

router.post(
  '/eventos/:id/inscripciones',
  limiteInscripcion,
  autenticarCuenta, // Regla 2: para inscribirse hace falta una cuenta (organizador o visitante)
  validar(idSchema, 'params'),
  boletos.inscribirse,
);

router.post('/boletos/cancelar', validar(cancelacionSchema), boletos.cancelar);

export default router;
