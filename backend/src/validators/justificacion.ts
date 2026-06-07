import { z } from 'zod';

export const justificacionSchema = z.object({
  docenteId: z.coerce.number().int().positive().optional().nullable(),
  dni: z
    .string()
    .trim()
    .min(1, 'Ingresa el DNI.')
    .regex(/^[0-9]{8,15}$/, 'El DNI debe contener solo números, mínimo 8 dígitos.'),
  nombres: z.string().trim().min(1, 'Ingresa los nombres.'),
  apellidos: z.string().trim().min(1, 'Ingresa los apellidos.'),
  telefono: z
    .string()
    .trim()
    .min(1, 'Ingresa el teléfono.')
    .regex(/^[0-9]{6,15}$/, 'El teléfono debe contener solo números, mínimo 6 dígitos.'),
  tipo: z.enum(['asistencia', 'permiso'], {
    errorMap: () => ({ message: 'Selecciona un tipo válido.' }),
  }),
  motivo: z.string().trim().min(1, 'Ingresa el motivo.'),
  claseADictar: z.string().trim().min(1, 'Ingresa la clase a dictar.'),
  aula: z.string().trim().min(1, 'Ingresa el aula.'),
  fechaJustificacion: z
    .string()
    .trim()
    .min(1, 'Selecciona la fecha.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD.'),
});

export type JustificacionInput = z.infer<typeof justificacionSchema>;
