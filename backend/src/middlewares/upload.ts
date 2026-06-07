import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const ROOT = path.resolve(process.cwd(), UPLOAD_DIR);

if (!fs.existsSync(ROOT)) {
  fs.mkdirSync(ROOT, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const sub = path.join(ROOT, 'justificaciones');
    if (!fs.existsSync(sub)) fs.mkdirSync(sub, { recursive: true });
    cb(null, sub);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '');
    const rnd = Math.random().toString(16).slice(2, 18);
    cb(null, `${ts}-${rnd}${ext}`);
  },
});

const ALLOWED = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']);
const MAX_BYTES = 8 * 1024 * 1024;

export const uploadJustificacion = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido. Use PDF, Word o imagen.'));
    }
    cb(null, true);
  },
}).single('archivo');

export const UPLOADS_ROOT = ROOT;
