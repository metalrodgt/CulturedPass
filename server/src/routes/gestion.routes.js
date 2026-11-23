import { Router } from 'express';
import { autenticar, soloAdministrador } from '../middlewares/auth.js';
import { validar } from '../middlewares/validar.js';
import {
  aprobacionSchema,
  asistenciaSchema,
  clavesSchema,
  editarCuentaSchema,
  eventoSchema,
  filtroBoletosSchema,
  idSchema,
} from '../validators/schemas.js';
import * as eventos from '../controllers/evento.controller.js';
import * as boletos from '../controllers/boleto.controller.js';
import * as organizadores from '../controllers/organizador.controller.js';
import * as visitantes from '../controllers/visitante.controller.js';
import * as claves from '../controllers/claves.controller.js';

// Todo lo que está aquí exige sesión de ORGANIZADOR autorizado
const router = Router();
router.use(autenticar);

const id = validar(idSchema, 'params');

// --- Eventos (regla 12: cualquier organizador administra cualquier evento) ---
router.get('/eventos', eventos.listarGestion);
router.post('/eventos', validar(eventoSchema), eventos.crear);
router.put('/eventos/:id', id, validar(eventoSchema), eventos.editar);
router.patch('/eventos/:id/finalizar', id, eventos.finalizar);
// Regla 27: cancelar un evento disponible (no se puede deshacer)
router.patch('/eventos/:id/cancelar', id, eventos.cancelar);
router.delete('/eventos/:id', id, eventos.eliminar);

// --- Asistencia (regla 17: se valida por código de boleto o por DNI) ---
router.get('/eventos/:id/boletos', id, validar(filtroBoletosSchema, 'query'), boletos.listarPorEvento);
router.patch('/boletos/:id/asistencia', id, validar(asistenciaSchema), boletos.marcarAsistencia);

// --- Cuentas de organizadores (regla 9: los permisos se validan dentro del controlador; solo el administrador edita a otros) ---
router.get('/organizadores', organizadores.listar);
// Aviso de la barra de navegación: cuántas cuentas esperan autorización (solo administrador)
router.get('/pendientes', soloAdministrador, organizadores.pendientes);
router.get('/organizadores/:id/impacto', id, organizadores.impactoEliminacion);
router.put('/organizadores/:id', id, validar(editarCuentaSchema), organizadores.editar);
router.patch('/organizadores/:id/aprobacion', id, validar(aprobacionSchema), organizadores.cambiarAprobacion);
router.delete('/organizadores/:id', id, organizadores.eliminar);

// --- Cuentas de visitantes (no necesitan autorización; editar/eliminar: solo administrador) ---
router.get('/visitantes', visitantes.listar);
// Regla 9: solo un administrador edita los datos de otras cuentas
router.put('/visitantes/:id', soloAdministrador, id, validar(editarCuentaSchema), visitantes.editar);
// Regla 9: solo un administrador elimina cuentas
router.delete('/visitantes/:id', soloAdministrador, id, visitantes.eliminar);

// --- Claves de registro (solo administrador) ---
router.get('/claves', soloAdministrador, claves.verClaves);
router.put('/claves', soloAdministrador, validar(clavesSchema), claves.cambiarClaves);

export default router;
