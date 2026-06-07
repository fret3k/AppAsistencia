import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { claseCreateSchema, claseUpdateSchema } from '../validators/clase';
import { HttpError } from '../middlewares/error';
import { validarDentroHorarioLaboral } from '../services/settings.service';

function toDateOnly(fecha: string): Date {
  return new Date(`${fecha}T00:00:00.000Z`);
}

function normalize(s: string | null | undefined) {
  return (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export async function listClases(req: Request, res: Response) {
  const mes = (req.query.mes as string | undefined)?.trim();
  const where: any = {};
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    where.fecha = { gte: start, lt: end };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    include: { docente: true },
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });
  const totalHoras = clases.reduce((acc, c) => acc + c.numeroHoras, 0);
  res.json({ clases, totalHoras, selectedMonth: mes ?? null });
}

export async function listClasesDocente(req: Request, res: Response) {
  const docenteId = Number(req.params.docenteId);
  const mes = (req.query.mes as string | undefined)?.trim();
  const where: any = { docenteId };
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    where.fecha = { gte: start, lt: end };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });
  res.json(clases);
}

export async function listMisClases(req: any, res: Response) {
  const docenteId = req.user.docenteId;
  if (!docenteId) throw new HttpError(403, 'Usuario sin docente asociado');
  const periodo = (req.query.periodo as string | undefined)?.trim();
  const where: any = { docenteId };
  if (periodo && /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    const [y, m] = periodo.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 1));
    where.fecha = { gte: start, lt: end };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });
  const totalHoras = clases.reduce((acc, c) => acc + c.numeroHoras, 0);
  res.json({ clases, totalHoras, periodo: periodo || null });
}

export async function getClase(req: Request, res: Response) {
  const id = Number(req.params.id);
  const clase = await prisma.claseDictada.findUnique({
    where: { id },
    include: { docente: true },
  });
  if (!clase) throw new HttpError(404, 'Clase no encontrada');
  res.json(clase);
}

export async function createClase(req: Request, res: Response) {
  await validarDentroHorarioLaboral();
  const data = claseCreateSchema.parse(req.body);
  const docenteId = data.docenteId;
  const docente = await prisma.docente.findUnique({ where: { id: docenteId } });
  if (!docente) throw new HttpError(404, 'Docente no encontrado');

  // Detección de duplicado (mismo docente + asignatura + tema + aula)
  if (data.tema && data.tema.trim() !== '') {
    const candidatos = await prisma.claseDictada.findMany({
      where: { docenteId },
      select: { id: true, asignatura: true, tema: true, aula: true },
    });
    const dup = candidatos.find(
      (c) =>
        normalize(c.asignatura) === normalize(data.asignatura) &&
        normalize(c.tema) === normalize(data.tema) &&
        normalize(c.aula) === normalize(data.aula)
    );
    if (dup) {
      throw new HttpError(409, 'Tema duplicado', {
        duplicate: `Alerta: El tema "${data.tema}" ya se encuentra registrado para este docente en la asignatura "${data.asignatura}".`,
      });
    }
  }

  // Detección de cruce de horario
  const overlap = await prisma.claseDictada.findFirst({
    where: {
      docenteId,
      fecha: toDateOnly(data.fecha),
      AND: [{ horaInicio: { lt: data.horaTermino } }, { horaTermino: { gt: data.horaInicio } }],
    },
    select: { id: true, asignatura: true, horaInicio: true, horaTermino: true },
  });
  if (overlap) {
    throw new HttpError(409, 'Cruce de horario', {
      duplicate: `Cruce de horario: Ya tiene una clase registrada de ${overlap.horaInicio.slice(0, 5)} a ${overlap.horaTermino.slice(0, 5)} en "${overlap.asignatura}".`,
    });
  }

  const created = await prisma.claseDictada.create({
    data: {
      docenteId,
      asignatura: data.asignatura,
      tema: data.tema ?? null,
      fecha: toDateOnly(data.fecha),
      horaInicio: data.horaInicio,
      horaTermino: data.horaTermino,
      aula: data.aula,
      numeroHoras: data.numeroHoras,
      firma: data.firma ?? null,
      firmaTermino: data.firmaTermino ?? null,
      observaciones: data.observaciones ?? null,
    },
  });
  res.status(201).json(created);
}

export async function updateClase(req: Request, res: Response) {
  const id = Number(req.params.id);
  const data = claseUpdateSchema.parse(req.body);
  const existing = await prisma.claseDictada.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Clase no encontrada');

  // Permiso: si es docente, solo puede editar sus propias clases
  if (req.user?.role === 'docente' && existing.docenteId !== req.user.docenteId) {
    throw new HttpError(403, 'No tiene permisos para editar esta clase');
  }

  const docenteId = data.docenteId ?? existing.docenteId;
  const asignatura = data.asignatura ?? existing.asignatura;
  const tema = data.tema ?? existing.tema;
  const aula = data.aula ?? existing.aula;
  const fechaStr =
    data.fecha ?? existing.fecha.toISOString().slice(0, 10);
  const horaInicio = data.horaInicio ?? existing.horaInicio;
  const horaTermino = data.horaTermino ?? existing.horaTermino;

  // Duplicado
  if (tema && tema.trim() !== '') {
    const candidatos = await prisma.claseDictada.findMany({
      where: { docenteId, NOT: { id } },
      select: { id: true, asignatura: true, tema: true, aula: true },
    });
    const dup = candidatos.find(
      (c) =>
        normalize(c.asignatura) === normalize(asignatura) &&
        normalize(c.tema) === normalize(tema) &&
        normalize(c.aula) === normalize(aula)
    );
    if (dup) {
      throw new HttpError(409, 'Tema duplicado', {
        duplicate: `Alerta: El tema "${tema}" ya se encuentra registrado para este docente en la asignatura "${asignatura}".`,
      });
    }
  }

  // Cruce
  const overlap = await prisma.claseDictada.findFirst({
    where: {
      docenteId,
      fecha: toDateOnly(fechaStr),
      NOT: { id },
      AND: [{ horaInicio: { lt: horaTermino } }, { horaTermino: { gt: horaInicio } }],
    },
    select: { id: true, asignatura: true, horaInicio: true, horaTermino: true },
  });
  if (overlap) {
    throw new HttpError(409, 'Cruce de horario', {
      duplicate: `Cruce de horario: Ya tiene una clase registrada de ${overlap.horaInicio.slice(0, 5)} a ${overlap.horaTermino.slice(0, 5)} en "${overlap.asignatura}".`,
    });
  }

  const updated = await prisma.claseDictada.update({
    where: { id },
    data: {
      ...(data.docenteId ? { docenteId: data.docenteId } : {}),
      ...(data.asignatura ? { asignatura: data.asignatura } : {}),
      ...(data.tema !== undefined ? { tema: data.tema } : {}),
      ...(data.fecha ? { fecha: toDateOnly(data.fecha) } : {}),
      ...(data.horaInicio ? { horaInicio: data.horaInicio } : {}),
      ...(data.horaTermino ? { horaTermino: data.horaTermino } : {}),
      ...(data.aula ? { aula: data.aula } : {}),
      ...(data.numeroHoras !== undefined ? { numeroHoras: data.numeroHoras } : {}),
      ...(data.firma !== undefined ? { firma: data.firma } : {}),
      ...(data.firmaTermino !== undefined ? { firmaTermino: data.firmaTermino } : {}),
      ...(data.observaciones !== undefined ? { observaciones: data.observaciones } : {}),
    },
  });
  res.json(updated);
}

export async function deleteClase(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.claseDictada.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Clase no encontrada');
  if (req.user?.role === 'docente' && existing.docenteId !== req.user.docenteId) {
    throw new HttpError(403, 'No tiene permisos para eliminar esta clase');
  }
  await prisma.claseDictada.delete({ where: { id } });
  res.status(204).send();
}

export async function mesesRegistrados(_req: Request, res: Response) {
  const rows = await prisma.$queryRaw<{ periodo: string; total_horas: number; total_clases: number }[]>`
    SELECT DATE_FORMAT(fecha, '%Y-%m') AS periodo,
           COALESCE(SUM(numero_horas), 0) AS total_horas,
           COUNT(*) AS total_clases
    FROM clases_dictadas
    GROUP BY periodo
    ORDER BY periodo DESC
  `;
  res.json(
    rows.map((r) => ({
      periodo: r.periodo,
      totalHoras: Number(r.total_horas),
      totalClases: Number(r.total_clases),
    }))
  );
}

export async function totalesPorMes(_req: Request, res: Response) {
  const rows = await prisma.$queryRaw<{ periodo: string; total: number }[]>`
    SELECT DATE_FORMAT(fecha, '%Y-%m') AS periodo,
           COALESCE(SUM(numero_horas), 0) AS total
    FROM clases_dictadas
    GROUP BY periodo
    ORDER BY periodo DESC
  `;
  const map: Record<string, number> = {};
  for (const r of rows) map[r.periodo] = Number(r.total);
  res.json(map);
}

export async function totalHoras(_req: Request, res: Response) {
  const r = await prisma.claseDictada.aggregate({
    _sum: { numeroHoras: true },
  });
  res.json({ totalHoras: r._sum.numeroHoras ?? 0 });
}
