import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma';

function setHeaders(res: Response, filename: string) {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${filename}"`
  );
}

function fmtDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function exportClases(req: Request, res: Response) {
  const mes = (req.query.mes as string | undefined)?.trim();
  const where: any = {};
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    where.fecha = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    include: { docente: true },
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Clases dictadas');
  ws.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Docente', key: 'docente', width: 35 },
    { header: 'Asignatura', key: 'asignatura', width: 25 },
    { header: 'Tema', key: 'tema', width: 35 },
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Hora inicio', key: 'horaInicio', width: 12 },
    { header: 'Hora término', key: 'horaTermino', width: 12 },
    { header: 'Aula', key: 'aula', width: 10 },
    { header: 'N° horas', key: 'numeroHoras', width: 10 },
    { header: 'Firma', key: 'firma', width: 25 },
    { header: 'Firma término', key: 'firmaTermino', width: 25 },
    { header: 'Observaciones', key: 'observaciones', width: 30 },
  ];
  clases.forEach((c) => {
    ws.addRow({
      id: c.id,
      docente: `${c.docente.apellidos}, ${c.docente.nombres}`,
      asignatura: c.asignatura,
      tema: c.tema,
      fecha: fmtDate(c.fecha),
      horaInicio: c.horaInicio.slice(0, 5),
      horaTermino: c.horaTermino.slice(0, 5),
      aula: c.aula,
      numeroHoras: c.numeroHoras,
      firma: c.firma,
      firmaTermino: c.firmaTermino,
      observaciones: c.observaciones,
    });
  });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0EFFF' } };
  setHeaders(res, mes ? `registro-clases-${mes}.xlsx` : `registro-clases-${fmtDate(new Date())}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

export async function exportTeacherHours(_req: Request, res: Response) {
  const docentes = await prisma.docente.findMany({
    include: { clases: true },
    orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
  });
  const map: Record<string, { nombres: string; apellidos: string; horas: Record<string, number>; total: number }> = {};
  const mesesSet = new Set<string>();
  for (const d of docentes) {
    const key = `${d.apellidos}, ${d.nombres}`;
    if (!map[key]) map[key] = { nombres: d.nombres, apellidos: d.apellidos, horas: {}, total: 0 };
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

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Reporte horas');
  const header = ['Docente', ...meses, 'Total'];
  ws.addRow(header);
  Object.values(map).forEach((d) => {
    ws.addRow([
      `${d.apellidos}, ${d.nombres}`,
      ...meses.map((m) => d.horas[m] ?? 0),
      d.total,
    ]);
  });
  ws.getRow(1).font = { bold: true };
  setHeaders(res, `reporte-horas-docentes-${fmtDate(new Date())}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}

export async function exportTeacherDetail(req: Request, res: Response) {
  const id = Number(req.params.id);
  const docente = await prisma.docente.findUnique({ where: { id } });
  if (!docente) return res.status(404).json({ message: 'Docente no encontrado' });
  const mes = (req.query.mes as string | undefined)?.trim();
  const where: any = { docenteId: id };
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) {
    const [y, m] = mes.split('-').map(Number);
    where.fecha = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }
  const clases = await prisma.claseDictada.findMany({
    where,
    orderBy: [{ fecha: 'desc' }, { horaInicio: 'desc' }],
  });
  const totalHoras = clases.reduce((acc, c) => acc + c.numeroHoras, 0);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Detalle ${docente.apellidos}`);
  ws.addRow(['Docente', `${docente.apellidos}, ${docente.nombres}`]);
  ws.addRow(['DNI', docente.dni]);
  ws.addRow(['Correo', docente.correo ?? '']);
  ws.addRow(['Teléfono', docente.telefono ?? '']);
  ws.addRow(['Especialidad', docente.especialidad ?? '']);
  ws.addRow([]);
  ws.addRow(['ID', 'Asignatura', 'Tema', 'Fecha', 'Inicio', 'Término', 'Aula', 'Horas', 'Firma', 'Firma término', 'Observaciones']);
  clases.forEach((c) => {
    ws.addRow([
      c.id,
      c.asignatura,
      c.tema,
      fmtDate(c.fecha),
      c.horaInicio.slice(0, 5),
      c.horaTermino.slice(0, 5),
      c.aula,
      c.numeroHoras,
      c.firma,
      c.firmaTermino,
      c.observaciones,
    ]);
  });
  ws.addRow([]);
  ws.addRow(['Total horas', totalHoras]);
  ws.getRow(7).font = { bold: true };
  setHeaders(
    res,
    `detalle-${docente.apellidos.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${docente.nombres.toLowerCase().replace(/[^a-z0-9]/g, '-')}${mes ? '-' + mes : ''}-${fmtDate(new Date())}.xlsx`
  );
  await wb.xlsx.write(res);
  res.end();
}

export async function exportJustificaciones(_req: Request, res: Response) {
  const justificaciones = await prisma.justificacion.findMany({
    include: { docente: true },
    orderBy: { createdAt: 'desc' },
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Justificaciones');
  ws.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'DNI', key: 'dni', width: 12 },
    { header: 'Nombres', key: 'nombres', width: 20 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Tipo', key: 'tipo', width: 12 },
    { header: 'Motivo', key: 'motivo', width: 40 },
    { header: 'Clase a dictar', key: 'claseADictar', width: 25 },
    { header: 'Aula', key: 'aula', width: 10 },
    { header: 'Fecha', key: 'fechaJustificacion', width: 12 },
    { header: 'Archivo', key: 'archivoNombre', width: 25 },
    { header: 'Docente', key: 'docente', width: 30 },
  ];
  justificaciones.forEach((j) => {
    ws.addRow({
      id: j.id,
      dni: j.dni,
      nombres: j.nombres,
      apellidos: j.apellidos,
      telefono: j.telefono,
      tipo: j.tipo,
      motivo: j.motivo,
      claseADictar: j.claseADictar,
      aula: j.aula,
      fechaJustificacion: fmtDate(j.fechaJustificacion),
      archivoNombre: j.archivoNombre,
      docente: j.docente ? `${j.docente.apellidos}, ${j.docente.nombres}` : '',
    });
  });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0EFFF' } };
  setHeaders(res, `justificaciones-${fmtDate(new Date())}.xlsx`);
  await wb.xlsx.write(res);
  res.end();
}
