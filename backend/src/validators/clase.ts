import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dateString = z
  .string()
  .trim()
  .min(1, 'La fecha es obligatoria.')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD.');

const timeString = z
  .string()
  .trim()
  .min(1, 'La hora es obligatoria.')
  .regex(timeRegex, 'La hora debe tener formato HH:MM.');

const claseBaseSchema = z.object({
  docenteId: z.coerce.number().int().positive('Selecciona un docente.'),
  asignatura: z.string().trim().min(1, 'La asignatura es obligatoria.'),
  tema: z.string().trim().optional().nullable(),
  fecha: dateString,
  horaInicio: timeString,
  horaTermino: timeString,
  aula: z.string().trim().min(1, 'El aula es obligatoria.'),
  numeroHoras: z.coerce
    .number()
    .int('El número de horas debe ser entero.')
    .min(1, 'El número de horas debe ser al menos 1.')
    .max(12, 'El número de horas no puede ser mayor a 12.'),
  firma: z.string().trim().optional().nullable(),
  firmaTermino: z.string().trim().optional().nullable(),
  observaciones: z.string().trim().optional().nullable(),
});

export const claseCreateSchema = claseBaseSchema
  .superRefine((data, ctx) => {
    if (data.horaInicio >= data.horaTermino) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['horaTermino'],
        message: 'La hora de término debe ser mayor que la hora de inicio.',
      });
    }
  });

export const claseUpdateSchema = claseBaseSchema.partial().superRefine((data, ctx) => {
  if (data.horaInicio && data.horaTermino && data.horaInicio >= data.horaTermino) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['horaTermino'],
      message: 'La hora de término debe ser mayor que la hora de inicio.',
    });
  }
});

export type ClaseCreateInput = z.infer<typeof claseCreateSchema>;
export type ClaseUpdateInput = z.infer<typeof claseUpdateSchema>;
