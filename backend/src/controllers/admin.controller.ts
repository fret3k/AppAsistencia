import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { isWorkingHoursEnabled, getSetting } from '../services/settings.service';

export async function dashboard(_req: Request, res: Response) {
  const totalDocentes = await prisma.docente.count();
  const totalClases = await prisma.claseDictada.count();
  const totalHorasAgg = await prisma.claseDictada.aggregate({
    _sum: { numeroHoras: true },
  });
  const totalHoras = totalHorasAgg._sum.numeroHoras ?? 0;

  const now = new Date();
  const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  const horasMesAgg = await prisma.claseDictada.aggregate({
    where: { fecha: { gte: start, lt: end } },
    _sum: { numeroHoras: true },
  });
  const horasMesActual = horasMesAgg._sum.numeroHoras ?? 0;

  const topDocentesRaw = await prisma.$queryRaw<
    { id: number; nombres: string; apellidos: string; especialidad: string | null; total_horas: number; total_clases: number }[]
  >`
    SELECT d.id, d.nombres, d.apellidos, d.especialidad,
           COALESCE(SUM(c.numero_horas), 0) AS total_horas,
           COUNT(c.id) AS total_clases
    FROM docentes d
    LEFT JOIN clases_dictadas c ON d.id = c.docente_id
    GROUP BY d.id, d.nombres, d.apellidos, d.especialidad
    ORDER BY total_horas DESC
    LIMIT 5
  `;
  const topDocentes = topDocentesRaw.map((r) => ({
    id: r.id,
    nombres: r.nombres,
    apellidos: r.apellidos,
    especialidad: r.especialidad,
    totalHoras: Number(r.total_horas),
    totalClases: Number(r.total_clases),
  }));

  const ultimasClases = await prisma.claseDictada.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { docente: true },
  });

  const notifsCount = await prisma.notificacion.count({ where: { leida: false } });
  const workingHoursEnabled = await isWorkingHoursEnabled();
  const workingHoursStart = await getSetting('working_hours_start', '13:00');
  const workingHoursEnd = await getSetting('working_hours_end', '23:59');

  res.json({
    totalDocentes,
    totalClases,
    totalHoras,
    horasMesActual,
    mesActual,
    topDocentes,
    ultimasClases,
    notifsCount,
    workingHoursEnabled,
    workingHoursStart,
    workingHoursEnd,
  });
}

export async function teacherHoursReport(req: Request, res: Response) {
  const search = (req.query.search as string | undefined)?.trim() ?? '';
  const where = search
    ? {
        OR: [
          { nombres: { contains: search } },
          { apellidos: { contains: search } },
        ],
      }
    : {};
  const docentes = await prisma.docente.findMany({
    where,
    include: { clases: true },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });

  const map: Record<string, { id: number; nombres: string; apellidos: string; horas: Record<string, number>; total: number }> = {};
  const mesesSet = new Set<string>();

  for (const d of docentes) {
    const key = `${d.apellidos}, ${d.nombres}`;
    if (!map[key]) {
      map[key] = { id: d.id, nombres: d.nombres, apellidos: d.apellidos, horas: {}, total: 0 };
    }
    for (const c of d.clases) {
      const y = c.fecha.getUTCFullYear();
      const m = String(c.fecha.getUTCMonth() + 1).padStart(2, '0');
      const mesKey = `${y}-${m}`;
      map[key].horas[mesKey] = (map[key].horas[mesKey] ?? 0) + c.numeroHoras;
      map[key].total += c.numeroHoras;
      mesesSet.add(mesKey);
    }
  }
  const meses = Array.from(mesesSet).sort();
  res.json({ docentes: Object.values(map), meses, search });
}

export async function teacherDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const docente = await prisma.docente.findUnique({ where: { id } });
  if (!docente) return res.status(404).json({ message: 'Docente no encontrado' });
  const mes = (req.query.mes as string | undefined)?.trim() || null;
  const where: any = { docenteId: id };
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    where.fecha = {
      gte: new Date(Date.UTC(y, m - 1, 1)),
      lt: new Date(Date.UTC(y, m, 1)),
    };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });
  const totalHoras = clases.reduce((acc, c) => acc + c.numeroHoras, 0);
  const totalClases = clases.length;

  const horasPorMesRaw = await prisma.$queryRaw<{ periodo: string; total: number }[]>`
    SELECT DATE_FORMAT(fecha, '%Y-%m') AS periodo, SUM(numero_horas) AS total
    FROM clases_dictadas WHERE docente_id = ${id}
    GROUP BY periodo ORDER BY periodo DESC
  `;
  const horasPorMes = horasPorMesRaw.map((r) => ({ periodo: r.periodo, total: Number(r.total) }));

  const allMesesRaw = await prisma.$queryRaw<{ periodo: string }[]>`
    SELECT DISTINCT DATE_FORMAT(fecha, '%Y-%m') AS periodo
    FROM clases_dictadas WHERE docente_id = ${id}
    ORDER BY periodo DESC
  `;
  const allMeses = allMesesRaw.map((r) => r.periodo);

  res.json({
    docente,
    clases,
    horasPorMes,
    totalHoras,
    totalClases,
    allMeses,
    selectedMonth: mes,
  });
}
