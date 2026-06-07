import { z } from 'zod';

const dniRegex = /^[0-9]{8}$/;
const telefonoRegex = /^[0-9]{9}$/;

export const docenteSchema = z.object({
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  dni: z
    .string()
    .trim()
    .min(1, 'El DNI es obligatorio.')
    .regex(dniRegex, 'El DNI debe tener exactamente 8 dígitos numéricos.'),
  correo: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .email('Ingresa un correo válido.'),
  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio.')
    .regex(telefonoRegex, 'El teléfono debe tener exactamente 9 dígitos numéricos.'),
  especialidad: z.string().trim().optional().nullable(),
});

export type DocenteInput = z.infer<typeof docenteSchema>;

export const docenteUpdateSchema = docenteSchema.partial();
export type DocenteUpdateInput = z.infer<typeof docenteUpdateSchema>;
