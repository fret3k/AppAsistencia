import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabase, BUCKET_NAME } from '../lib/supabase';
import { HttpError } from '../middlewares/error';
import { justificacionSchema } from '../validators/justificacion';
import path from 'path';

function toDateOnly(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

/**
 * Genera un nombre de archivo único para Supabase Storage.
 * Ejemplo: justificaciones/20241215123456-abc123.pdf
 */
function buildStoragePath(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const ts = new Date().toISOString().replace(/[-:T.Z]/g, '');
  const rnd = Math.random().toString(16).slice(2, 10);
  return `justificaciones/${ts}-${rnd}${ext}`;
}

export async function listJustificaciones(_req: Request, res: Response) {
  const justificaciones = await prisma.justificacion.findMany({
    include: { docente: true },
    orderBy: { createdAt: 'desc' },
  });
  const total = await prisma.justificacion.count();
  res.json({ justificaciones, total });
}

export async function getJustificacion(req: Request, res: Response) {
  const id = Number(req.params.id);
  const j = await prisma.justificacion.findUnique({
    where: { id },
    include: { docente: true },
  });
  if (!j) throw new HttpError(404, 'Justificación no encontrada');
  res.json(j);
}

export async function createJustificacion(req: Request, res: Response) {
  const data = justificacionSchema.parse(req.body);

  if (!req.file) {
    throw new HttpError(422, 'Sube un documento Word, PDF o imagen.', {
      archivo: 'Sube un documento Word, PDF o imagen.',
    });
  }

  // Subir archivo a Supabase Storage
  const storagePath = buildStoragePath(req.file.originalname);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    console.error('[Supabase Storage] Error al subir archivo:', uploadError.message);
    throw new HttpError(500, `Error al guardar el archivo: ${uploadError.message}`);
  }

  // Obtener URL pública del archivo subido
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  const archivo = {
    archivoPath: publicUrlData.publicUrl,   // URL pública de Supabase Storage
    archivoNombre: req.file.originalname,
    archivoTipo: req.file.mimetype,
  };

  const created = await prisma.justificacion.create({
    data: {
      docenteId: data.docenteId ?? null,
      dni: data.dni,
      nombres: data.nombres,
      apellidos: data.apellidos,
      telefono: data.telefono,
      tipo: data.tipo,
      motivo: data.motivo,
      claseADictar: data.claseADictar,
      aula: data.aula,
      fechaJustificacion: toDateOnly(data.fechaJustificacion),
      ...archivo,
    },
  });

  // Crear notificación para administradores
  const docenteNombre = data.docenteId
    ? (await prisma.docente.findUnique({ where: { id: data.docenteId } }))
    : null;
  const displayName = docenteNombre
    ? `${docenteNombre.apellidos}, ${docenteNombre.nombres}`
    : `${data.apellidos}, ${data.nombres}`;
  const tipoTexto = data.tipo === 'asistencia' ? 'asistencia a clase' : 'permiso';
  await prisma.notificacion.create({
    data: {
      tipo: 'justificacion',
      titulo: 'Nueva justificación registrada',
      mensaje: `El docente ${displayName} ha registrado una justificación de ${tipoTexto} para la clase "${data.claseADictar}" del ${data.fechaJustificacion}.`,
      justificacionId: created.id,
    },
  });

  res.status(201).json(created);
}

/**
 * Descarga / visualiza el archivo de una justificación.
 * archivoPath ahora es una URL pública de Supabase Storage → redirigimos directamente.
 */
export async function downloadArchivo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const j = await prisma.justificacion.findUnique({ where: { id } });
  if (!j || !j.archivoPath) throw new HttpError(404, 'Archivo no encontrado');

  // Si la ruta es una URL de Supabase (migración nueva), redirigir
  if (j.archivoPath.startsWith('http')) {
    const download = (req.query.download as string | undefined) === '1';
    if (download) {
      // Para forzar descarga, hacemos proxy del archivo
      const response = await fetch(j.archivoPath);
      if (!response.ok) throw new HttpError(404, 'Archivo no encontrado en Storage');
      res.setHeader('Content-Type', j.archivoTipo || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${(j.archivoNombre || 'archivo').replace(/"/g, '')}"`
      );
      res.setHeader('X-Content-Type-Options', 'nosniff');
      const buffer = Buffer.from(await response.arrayBuffer());
      return res.send(buffer);
    }
    // Para visualización, redirigir a la URL pública
    return res.redirect(302, j.archivoPath);
  }

  // Fallback: archivos locales legados (si hubiera alguno de antes de la migración)
  throw new HttpError(404, 'Archivo no encontrado');
}
