import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { errorHandler, notFoundHandler } from './middlewares/error';
import routes from './routes';
import { UPLOADS_ROOT } from './middlewares/upload';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// En producción frontend y backend comparten la misma URL — no se necesita CORS externo.
// En desarrollo el proxy de Vite maneja las peticiones a /api.
if (NODE_ENV !== 'production') {
  app.use(cors({ origin: CORS_ORIGIN.split(','), credentials: true }));
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Archivos subidos (justificaciones, etc.)
app.use('/uploads', express.static(UPLOADS_ROOT));

// Health check y rutas de la API
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.use('/api', routes);

// En producción: servir el frontend compilado (Vite dist)
if (NODE_ENV === 'production') {
  const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

  if (fs.existsSync(FRONTEND_DIST)) {
    // Archivos estáticos de React (JS, CSS, imágenes...)
    app.use(express.static(FRONTEND_DIST));

    // SPA fallback: cualquier ruta que no sea /api devuelve index.html
    app.get('*', (_req, res) => {
      res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
  } else {
    console.warn(`[warn] Frontend dist no encontrado en: ${FRONTEND_DIST}`);
    // Si no hay frontend compilado, dejar el 404 handler
    app.use(notFoundHandler);
  }
} else {
  // En desarrollo: mantener el 404 handler de la API
  app.use(notFoundHandler);
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Modo: ${NODE_ENV}`);
  console.log(`Uploads en: ${path.resolve(UPLOADS_ROOT)}`);
});
