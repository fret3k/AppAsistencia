import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';
import { justificacionSchema } from '../validators/justificacion';
import path from 'path';
import fs from 'fs';
import { UPLOADS_ROOT } from '../middlewares/upload';

function toDateOnly(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function relativeFromUploads(absPath: string): string {
  return path.relative(UPLOADS_ROOT, absPath).replace(/\\/g, '/');
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

  const archivo = {
    archivoPath: relativeFromUploads(req.file.path),
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

export async function downloadArchivo(req: Request, res: Response) {
  const id = Number(req.params.id);
  const j = await prisma.justificacion.findUnique({ where: { id } });
  if (!j || !j.archivoPath) throw new HttpError(404, 'Archivo no encontrado');
  const abs = path.resolve(UPLOADS_ROOT, j.archivoPath);
  const realBase = fs.realpathSync(UPLOADS_ROOT);
  const realFile = fs.existsSync(abs) ? fs.realpathSync(abs) : null;
  if (!realFile || !realFile.startsWith(realBase)) {
    throw new HttpError(404, 'Archivo no encontrado');
  }
  const download = (req.query.download as string | undefined) === '1';
  res.setHeader(
    'Content-Type',
    j.archivoTipo || 'application/octet-stream'
  );
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="${(j.archivoNombre || path.basename(realFile)).replace(/"/g, '')}"`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(realFile).pipe(res);
}
