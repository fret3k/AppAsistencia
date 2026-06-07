import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Recurso no encontrado' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: 'Errores de validación',
      errors: err.flatten().fieldErrors,
    });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
}
