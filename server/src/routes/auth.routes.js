import { Router } from 'express';
import { autenticarCuenta } from '../middlewares/auth.js';
import { limiteLogin, limiteRecuperacion, limiteRegistro } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { editarCuentaSchema, loginSchema, recuperarSchema, registroSchema, restablecerSchema } from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', limiteRegistro, validar(registroSchema), auth.registro);
router.post('/login', limiteLogin, validar(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', autenticarCuenta, auth.me);

// Mi cuenta: cualquier cuenta con sesión edita SUS propios datos
router.put('/mi-cuenta', autenticarCuenta, validar(editarCuentaSchema), auth.actualizarMiCuenta);

// Recuperación de contraseña: se envía un enlace al correo y con él se elige la nueva
router.post('/recuperar', limiteRecuperacion, validar(recuperarSchema), auth.solicitarRecuperacion);
router.post('/restablecer', limiteLogin, validar(restablecerSchema), auth.restablecerContrasena);

export default router;
