import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/express';

const JWT_SECRET = process.env.JWT_SECRET || 'cambia-esto-en-produccion';

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  } as jwt.SignOptions);
}

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

export function requireAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (req.user.role !== 'admin' || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol administrador.' });
  }
  next();
}

export function requireDocente(req: any, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (req.user.role !== 'docente') {
    return res.status(403).json({ message: 'Acceso denegado. Se requiere rol docente.' });
  }
  next();
}
