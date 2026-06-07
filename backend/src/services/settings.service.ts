import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middlewares/error';

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function isWorkingHoursEnabled(): Promise<boolean> {
  return (await getSetting('working_hours_enabled', '0')) === '1';
}

export async function isWithinWorkingHours(): Promise<boolean> {
  if (!(await isWorkingHoursEnabled())) return true;
  const start = await getSetting('working_hours_start', '13:00');
  const end = await getSetting('working_hours_end', '23:59');
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const current = `${hh}:${mm}`;
  return current >= start && current <= end;
}

export async function validarDentroHorarioLaboral(): Promise<void> {
  if (!(await isWorkingHoursEnabled())) return;
  if (await isWithinWorkingHours()) return;
  const start = await getSetting('working_hours_start', '13:00');
  const end = await getSetting('working_hours_end', '23:59');
  throw new HttpError(
    422,
    `No se pueden registrar clases fuera del horario laborable (${start} - ${end}).`
  );
}

export async function getSettings(_req: Request, res: Response) {
  const enabled = await isWorkingHoursEnabled();
  const start = await getSetting('working_hours_start', '13:00');
  const end = await getSetting('working_hours_end', '23:59');
  const within = await isWithinWorkingHours();
  res.json({ enabled, start, end, within });
}

export async function toggleWorkingHours(_req: Request, res: Response) {
  const enabled = await isWorkingHoursEnabled();
  await setSetting('working_hours_enabled', enabled ? '0' : '1');
  const start = await getSetting('working_hours_start', '13:00');
  const end = await getSetting('working_hours_end', '23:59');
  res.json({
    enabled: !enabled,
    message: enabled
      ? 'Horario laborable desactivado.'
      : `Horario laborable activado (${start} - ${end}).`,
  });
}

export async function updateWorkingHours(req: Request, res: Response) {
  const start = String(req.body.start ?? '13:00');
  const end = String(req.body.end ?? '23:59');
  const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
  await setSetting('working_hours_start', timeRe.test(start) ? start : '13:00');
  await setSetting('working_hours_end', timeRe.test(end) ? end : '23:59');
  res.json({ message: 'Horario laborable actualizado.' });
}
