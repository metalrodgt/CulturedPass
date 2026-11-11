import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { limiteLogin, limiteRegistro } from '../middlewares/limitadores.js';
import { validar } from '../middlewares/validar.js';
import { loginSchema, registroSchema } from '../validators/schemas.js';
import * as auth from '../controllers/auth.controller.js';

const router = Router();

router.post('/registro', limiteRegistro, validar(registroSchema), auth.registro);
router.post('/login', limiteLogin, validar(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.get('/me', autenticar, auth.me);

export default router;
