import { Router } from 'express';
import { autenticar, soloAdministrador } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import {
  aprobacionSchema,
  asistenciaSchema,
  editarOrganizadorSchema,
  eventoSchema,
  filtroBoletosSchema,
  idSchema,
} from '../validators/schemas.js';
import * as eventos from '../controllers/evento.controller.js';
import * as boletos from '../controllers/boleto.controller.js';
import * as organizadores from '../controllers/organizador.controller.js';

// Regla 3: TODO lo que está aquí exige sesión de organizador aprobado
const router = Router();
router.use(autenticar);

const id = validar(idSchema, 'params');

// --- Eventos ---
router.get('/eventos', eventos.listarGestion);
router.post('/eventos', validar(eventoSchema), eventos.crear);
router.put('/eventos/:id', id, validar(eventoSchema), eventos.editar);
router.patch('/eventos/:id/finalizar', id, eventos.finalizar);
router.delete('/eventos/:id', id, eventos.eliminar);

// --- Asistencia ---
router.get('/eventos/:id/boletos', id, validar(filtroBoletosSchema, 'query'), boletos.listarPorEvento);
router.patch('/boletos/:id/asistencia', id, validar(asistenciaSchema), boletos.marcarAsistencia);

// --- Cuentas ---
router.get('/organizadores', organizadores.listar);
// Solo el administrador puede ver la clave de registro
router.get('/clave', soloAdministrador, organizadores.verClave);
router.get('/organizadores/:id/impacto', id, organizadores.impactoEliminacion);
router.put('/organizadores/:id', id, validar(editarOrganizadorSchema), organizadores.editar);
router.patch('/organizadores/:id/aprobacion', id, validar(aprobacionSchema), organizadores.cambiarAprobacion);
router.delete('/organizadores/:id', id, organizadores.eliminar);

export default router;
