import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clases, docentes as docentesApi } from '@/lib/services';
import type { Docente } from '@/types';
import { getApiError } from '@/lib/api';

const schema = z
  .object({
    docenteId: z.coerce.number().int().positive('Selecciona un docente.'),
    asignatura: z.string().trim().min(1, 'La asignatura es obligatoria.'),
    tema: z.string().trim().optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD).'),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora de inicio inválida.'),
    horaTermino: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora de término inválida.'),
    aula: z.string().trim().min(1, 'El aula es obligatoria.'),
    numeroHoras: z.coerce.number().int().min(1, 'Mínimo 1 hora.').max(12, 'Máximo 12 horas.'),
    firma: z.string().trim().optional(),
    observaciones: z.string().trim().optional(),
  })
  .refine((d) => d.horaInicio < d.horaTermino, {
    path: ['horaTermino'],
    message: 'La hora de término debe ser mayor que la hora de inicio.',
  });

type FormData = z.infer<typeof schema>;

export function ClaseCreatePage() {
  const navigate = useNavigate();
  const [list, setList] = useState<Docente[]>([]);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      horaInicio: new Date().toTimeString().slice(0, 5),
    },
  });

  useEffect(() => {
    docentesApi.list().then(setList).catch(() => undefined);
  }, []);

  // Calcular número de horas automáticamente si difieren las horas
  const horaInicio = watch('horaInicio');
  const horaTermino = watch('horaTermino');
  useEffect(() => {
    if (horaInicio && horaTermino && horaTermino > horaInicio) {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [h2, m2] = horaTermino.split(':').map(Number);
      const minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
      const horas = Math.max(1, Math.round(minutos / 60));
      setValue('numeroHoras', horas);
    }
  }, [horaInicio, horaTermino, setValue]);

  const onSubmit = async (data: FormData) => {
    setDuplicateMsg(null);
    try {
      await clases.create(data);
      toast.success('Clase registrada correctamente');
      navigate('/clases');
    } catch (err) {
      const apiErr = getApiError(err);
      toast.error(apiErr.message);
      const dups = (apiErr.details as any)?.duplicate;
      if (dups) setDuplicateMsg(String(dups));
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-10">
        <div className="card page-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Registrar clase dictada</h4>
            <Link to="/clases" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-arrow-left me-1" /> Volver
            </Link>
          </div>
          {duplicateMsg && (
            <div className="alert alert-warning" dangerouslySetInnerHTML={{ __html: duplicateMsg }} />
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Docente *</label>
                <select className={`form-select ${errors.docenteId ? 'is-invalid' : ''}`} {...register('docenteId')}>
                  <option value="">Selecciona un docente</option>
                  {list.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres} ({d.dni})</option>
                  ))}
                </select>
                {errors.docenteId && <div className="invalid-feedback">{errors.docenteId.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Asignatura *</label>
                <input className={`form-control ${errors.asignatura ? 'is-invalid' : ''}`} {...register('asignatura')} />
                {errors.asignatura && <div className="invalid-feedback">{errors.asignatura.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Tema</label>
                <input className="form-control" {...register('tema')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha *</label>
                <input type="date" className={`form-control ${errors.fecha ? 'is-invalid' : ''}`} {...register('fecha')} />
                {errors.fecha && <div className="invalid-feedback">{errors.fecha.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Hora inicio *</label>
                <input type="time" className={`form-control ${errors.horaInicio ? 'is-invalid' : ''}`} {...register('horaInicio')} />
                {errors.horaInicio && <div className="invalid-feedback">{errors.horaInicio.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Hora término *</label>
                <input type="time" className={`form-control ${errors.horaTermino ? 'is-invalid' : ''}`} {...register('horaTermino')} />
                {errors.horaTermino && <div className="invalid-feedback">{errors.horaTermino.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">N° de horas *</label>
                <input type="number" min={1} max={12} className={`form-control ${errors.numeroHoras ? 'is-invalid' : ''}`} {...register('numeroHoras')} />
                {errors.numeroHoras && <div className="invalid-feedback">{errors.numeroHoras.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Aula *</label>
                <input className={`form-control ${errors.aula ? 'is-invalid' : ''}`} {...register('aula')} />
                {errors.aula && <div className="invalid-feedback">{errors.aula.message}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Firma</label>
                <input className="form-control" placeholder="Nombre del docente" {...register('firma')} />
              </div>
              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <textarea className="form-control" rows={2} {...register('observaciones')} />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Link to="/clases" className="btn btn-light">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar clase'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
