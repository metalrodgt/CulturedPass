import { Router } from 'express';
import authRoutes from './auth.routes.js';
import publicoRoutes from './publico.routes.js';
import gestionRoutes from './gestion.routes.js';

const router = Router();

router.get('/salud', (req, res) => res.json({ estado: 'ok', servicio: 'CulturedPass API' }));
router.use('/auth', authRoutes);
router.use('/gestion', gestionRoutes);
router.use('/', publicoRoutes);

export default router;
