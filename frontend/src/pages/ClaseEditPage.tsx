import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clases, docentes as docentesApi } from '@/lib/services';
import type { Docente } from '@/types';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

const schema = z
  .object({
    docenteId: z.coerce.number().int().positive(),
    asignatura: z.string().trim().min(1),
    tema: z.string().trim().optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    horaTermino: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    aula: z.string().trim().min(1),
    numeroHoras: z.coerce.number().int().min(1).max(12),
    firma: z.string().trim().optional(),
    firmaTermino: z.string().trim().optional(),
    observaciones: z.string().trim().optional(),
  })
  .refine((d) => d.horaInicio < d.horaTermino, {
    path: ['horaTermino'],
    message: 'La hora de término debe ser mayor.',
  });
type FormData = z.infer<typeof schema>;

export function ClaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [docentesList, setDocentesList] = useState<Docente[]>([]);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([clases.get(Number(id)), docentesApi.list()])
      .then(([c, ds]) => {
        setDocentesList(ds);
        reset({
          docenteId: c.docenteId,
          asignatura: c.asignatura,
          tema: c.tema ?? '',
          fecha: c.fecha.slice(0, 10),
          horaInicio: c.horaInicio.slice(0, 5),
          horaTermino: c.horaTermino.slice(0, 5),
          aula: c.aula,
          numeroHoras: c.numeroHoras,
          firma: c.firma ?? '',
          firmaTermino: c.firmaTermino ?? '',
          observaciones: c.observaciones ?? '',
        });
      })
      .catch((err) => toast.error(getApiError(err).message));
  }, [id, reset]);

  const onSubmit = async (data: FormData) => {
    setDuplicateMsg(null);
    try {
      await clases.update(Number(id), data);
      toast.success('Clase actualizada');
      navigate(-1);
    } catch (err) {
      const apiErr = getApiError(err);
      toast.error(apiErr.message);
      const dups = (apiErr.details as any)?.duplicate;
      if (dups) setDuplicateMsg(String(dups));
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card page-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Editar clase</h4>
            <Link to="/clases" className="btn btn-sm btn-outline-secondary">Volver</Link>
          </div>
          {duplicateMsg && <div className="alert alert-warning" dangerouslySetInnerHTML={{ __html: duplicateMsg }} />}
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Docente *</label>
                <select className={`form-select ${errors.docenteId ? 'is-invalid' : ''}`} {...register('docenteId')}>
                  <option value="">Selecciona</option>
                  {docentesList.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Asignatura *</label>
                <input className={`form-control ${errors.asignatura ? 'is-invalid' : ''}`} {...register('asignatura')} />
              </div>
              <div className="col-12">
                <label className="form-label">Tema</label>
                <input className="form-control" {...register('tema')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha *</label>
                <input type="date" className="form-control" {...register('fecha')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Inicio *</label>
                <input type="time" className="form-control" {...register('horaInicio')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Término *</label>
                <input type="time" className="form-control" {...register('horaTermino')} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Horas *</label>
                <input type="number" min={1} max={12} className="form-control" {...register('numeroHoras')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Aula *</label>
                <input className="form-control" {...register('aula')} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Firma</label>
                <input className="form-control" {...register('firma')} />
              </div>
              <div className="col-12">
                <label className="form-label">Observaciones</label>
                <textarea className="form-control" rows={2} {...register('observaciones')} />
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Link to="/clases" className="btn btn-light">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Actualizar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
