import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function listNoLeidas(_req: Request, res: Response) {
  const notifs = await prisma.notificacion.findMany({
    where: { leida: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      clase: { include: { docente: true } },
      justificacion: { include: { docente: true } },
    },
  });
  const total = await prisma.notificacion.count({ where: { leida: false } });
  res.json({ notifs, total });
}

export async function listRecientes(_req: Request, res: Response) {
  const notifs = await prisma.notificacion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      clase: { include: { docente: true } },
      justificacion: { include: { docente: true } },
    },
  });
  res.json(notifs);
}

export async function marcarLeida(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.notificacion.update({ where: { id }, data: { leida: true } });
  res.json({ ok: true });
}

export async function marcarTodasLeidas(_req: Request, res: Response) {
  await prisma.notificacion.updateMany({ where: { leida: false }, data: { leida: true } });
  res.json({ ok: true });
}
