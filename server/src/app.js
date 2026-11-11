import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { limiteGlobal } from './middlewares/limitadores.js';
import { errorHandler, noEncontrado } from './middlewares/errorHandler.js';
import rutas from './routes/index.js';

const app = express();

// Si algún día se despliega detrás de un proxy (Render, Nginx...), activar:
// app.set('trust proxy', 1);

app.use(helmet()); // cabeceras de seguridad HTTP
app.use(
  cors({
    origin: env.CLIENT_URL, // solo el frontend autorizado
    credentials: true, // necesario para la cookie de sesión
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.use('/api', limiteGlobal, rutas);

app.use(noEncontrado);
app.use(errorHandler);

export default app;
