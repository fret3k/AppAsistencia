import multer from 'multer';
import path from 'path';

const ALLOWED = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.webp']);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Middleware de upload que guarda el archivo en MEMORIA (buffer).
 * El buffer se sube a Supabase Storage en el controlador.
 * Ya no se escribe nada en disco.
 */
export const uploadJustificacion = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error('Tipo de archivo no permitido. Use PDF, Word o imagen.'));
    }
    cb(null, true);
  },
}).single('archivo');

/**
 * UPLOADS_ROOT se mantiene exportado para no romper otros imports,
 * pero ya no se utiliza para almacenamiento — los archivos van a Supabase Storage.
 * @deprecated Usar Supabase Storage en su lugar.
 */
export const UPLOADS_ROOT = '';
