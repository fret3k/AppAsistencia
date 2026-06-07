import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { signToken } from '../middlewares/auth';
import { HttpError } from '../middlewares/error';
import { z } from 'zod';

const adminLoginSchema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

const docenteLoginSchema = z.object({
  dni: z.string().trim().min(1, 'El DNI es obligatorio.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export async function adminLogin(req: Request, res: Response) {
  const data = adminLoginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new HttpError(401, 'Email o contraseña incorrectos');
  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) throw new HttpError(401, 'Email o contraseña incorrectos');
  if (user.role !== 'admin' || !user.isAdmin) {
    throw new HttpError(403, 'No tiene permisos de administrador');
  }
  const token = signToken({
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    role: 'admin',
  });
  res.json({
    token,
    user: { id: user.id, email: user.email, role: 'admin', isAdmin: true },
  });
}

export async function docenteLogin(req: Request, res: Response) {
  const data = docenteLoginSchema.parse(req.body);
  // En el proyecto PHP original el docente inicia sesión con su DNI = DNI = password.
  // Conservamos esa semántica, pero el password se compara con bcrypt contra users.password.
  const docente = await prisma.docente.findUnique({ where: { dni: data.dni } });
  if (!docente) throw new HttpError(401, 'DNI no registrado como docente');

  // Buscar usuario asociado al docente
  let user = await prisma.user.findFirst({ where: { docenteId: docente.id } });
  if (!user) {
    // Crear automáticamente (al estilo del PHP)
    user = await prisma.user.create({
      data: {
        email: `${docente.dni}@docente.local`,
        password: await bcrypt.hash(docente.dni, 10),
        isAdmin: false,
        role: 'docente',
        docenteId: docente.id,
      },
    });
  }

  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) {
    // Por compatibilidad con el PHP original, si el password coincide con el DNI,
    // lo actualizamos al hash del DNI.
    if (data.password === docente.dni) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: await bcrypt.hash(docente.dni, 10) },
      });
    } else {
      throw new HttpError(401, 'DNI o contraseña incorrectos');
    }
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    isAdmin: false,
    role: 'docente',
    docenteId: docente.id,
    docenteNombres: docente.nombres,
    docenteApellidos: docente.apellidos,
  });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: 'docente',
      isAdmin: false,
      docenteId: docente.id,
      docenteNombres: docente.nombres,
      docenteApellidos: docente.apellidos,
    },
  });
}

export async function me(req: any, res: Response) {
  res.json({ user: req.user });
}
