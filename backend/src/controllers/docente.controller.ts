import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { docenteSchema, docenteUpdateSchema } from '../validators/docente';
import { HttpError } from '../middlewares/error';

function normalize(s: string | null | undefined) {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export async function listDocentes(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  const where = q
    ? {
        OR: [
          { nombres: { contains: q } },
          { apellidos: { contains: q } },
        ],
      }
    : {};
  const docentes = await prisma.docente.findMany({
    where,
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });
  res.json(docentes);
}

export async function getDocente(req: Request, res: Response) {
  const id = Number(req.params.id);
  const docente = await prisma.docente.findUnique({ where: { id } });
  if (!docente) throw new HttpError(404, 'Docente no encontrado');
  res.json(docente);
}

export async function createDocente(req: Request, res: Response) {
  const data = docenteSchema.parse(req.body);
  const duplicateMessages: string[] = [];

  const checks: Array<['dni' | 'telefono' | 'correo', string]> = [
    ['dni', 'DNI'],
    ['telefono', 'teléfono'],
    ['correo', 'correo'],
  ];

  for (const [field, label] of checks) {
    const value = (data[field] as string) || '';
    const existing = await prisma.docente.findFirst({ where: { [field]: value } });
    if (existing) {
      const firstName = (existing.nombres || '').split(' ')[0] || existing.nombres;
      duplicateMessages.push(
        `El ${label} <strong>${value}</strong> ya está registrado por <strong>${firstName}</strong>.`
      );
    }
  }

  if (duplicateMessages.length) {
    throw new HttpError(409, 'Docente duplicado', { duplicate: duplicateMessages });
  }

  const docente = await prisma.docente.create({
    data: {
      nombres: data.nombres,
      apellidos: data.apellidos,
      dni: data.dni,
      correo: data.correo,
      telefono: data.telefono,
      especialidad: data.especialidad ?? null,
    },
  });
  res.status(201).json(docente);
}

export async function updateDocente(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = docenteUpdateSchema.parse(req.body);
  const existing = await prisma.docente.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Docente no encontrado');

  const duplicateMessages: string[] = [];

  if (data.dni && data.dni !== existing.dni) {
    const dup = await prisma.docente.findFirst({ where: { dni: data.dni, NOT: { id } } });
    if (dup) {
      const firstName = (dup.nombres || '').split(' ')[0] || dup.nombres;
      duplicateMessages.push(
        `El DNI <strong>${data.dni}</strong> ya está registrado por <strong>${firstName}</strong>.`
      );
    }
  }
  if (data.telefono && data.telefono !== existing.telefono) {
    const dup = await prisma.docente.findFirst({ where: { telefono: data.telefono, NOT: { id } } });
    if (dup) {
      const firstName = (dup.nombres || '').split(' ')[0] || dup.nombres;
      duplicateMessages.push(
        `El teléfono <strong>${data.telefono}</strong> ya está registrado por <strong>${firstName}</strong>.`
      );
    }
  }
  if (data.correo && data.correo !== existing.correo) {
    const dup = await prisma.docente.findFirst({ where: { correo: data.correo, NOT: { id } } });
    if (dup) {
      const firstName = (dup.nombres || '').split(' ')[0] || dup.nombres;
      duplicateMessages.push(
        `El correo <strong>${data.correo}</strong> ya está registrado por <strong>${firstName}</strong>.`
      );
    }
  }

  if (duplicateMessages.length) {
    throw new HttpError(409, 'Docente duplicado', { duplicate: duplicateMessages });
  }

  const updated = await prisma.docente.update({ where: { id }, data });
  res.json(updated);
}

export async function deleteDocente(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.docente.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Docente no encontrado');
  await prisma.docente.delete({ where: { id } });
  res.status(204).send();
}

export async function searchDocentes(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim() ?? '';
  if (!q) return listDocentes(req, res);
  const like = `%${q}%`;
  const docentes = await prisma.docente.findMany({
    where: {
      OR: [
        { nombres: { contains: q } },
        { apellidos: { contains: q } },
      ],
    },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });
  res.json(docentes);
}
