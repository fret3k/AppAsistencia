import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clases, docentes as docentesApi } from '@/lib/services';
import type { Clase, Docente } from '@/types';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

const schema = z
  .object({
    docenteId: z.coerce.number().int().positive('Selecciona un docente.'),
    asignatura: z.string().trim().min(1, 'La asignatura es obligatoria.'),
    tema: z.string().trim().optional(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida.'),
    horaTermino: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida.'),
    aula: z.string().trim().min(1, 'Aula obligatoria.'),
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

export function AdminHorasPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Clase[]>([]);
  const [docentesList, setDocentesList] = useState<Docente[]>([]);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fecha: new Date().toISOString().slice(0, 10),
      horaInicio: new Date().toTimeString().slice(0, 5),
    },
  });

  const load = async () => {
    try {
      const [a, b] = await Promise.all([clases.list(), docentesApi.list()]);
      setItems(a.clases);
      setDocentesList(b);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  useEffect(() => { load(); }, []);

  const horaInicio = watch('horaInicio');
  const horaTermino = watch('horaTermino');
  useEffect(() => {
    if (horaInicio && horaTermino && horaTermino > horaInicio) {
      const [h1, m1] = horaInicio.split(':').map(Number);
      const [h2, m2] = horaTermino.split(':').map(Number);
      const minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
      setValue('numeroHoras', Math.max(1, Math.round(minutos / 60)));
    }
  }, [horaInicio, horaTermino, setValue]);

  const onSubmit = async (data: FormData) => {
    setDuplicateMsg(null);
    try {
      await clases.create(data);
      toast.success('Clase registrada');
      reset({ ...data, tema: '', observaciones: '', firma: '', firmaTermino: '' });
      load();
    } catch (err) {
      const apiErr = getApiError(err);
      toast.error(apiErr.message);
      const dups = (apiErr.details as any)?.duplicate;
      if (dups) setDuplicateMsg(String(dups));
    }
  };

  const handleDelete = async (id: number) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar registro?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!r.isConfirmed) return;
    try {
      await clases.remove(id);
      toast.success('Eliminado');
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <div>
      <h3 className="mb-3">Administrar horas dictadas</h3>
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card page-card p-4">
            <h5>Registrar nueva clase</h5>
            {duplicateMsg && <div className="alert alert-warning mt-2" dangerouslySetInnerHTML={{ __html: duplicateMsg }} />}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-2">
              <div className="mb-2">
                <label className="form-label">Docente *</label>
                <select className={`form-select ${errors.docenteId ? 'is-invalid' : ''}`} {...register('docenteId')}>
                  <option value="">Selecciona</option>
                  {docentesList.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
                {errors.docenteId && <div className="invalid-feedback">{errors.docenteId.message}</div>}
              </div>
              <div className="mb-2">
                <label className="form-label">Asignatura *</label>
                <input className={`form-control ${errors.asignatura ? 'is-invalid' : ''}`} {...register('asignatura')} />
              </div>
              <div className="mb-2">
                <label className="form-label">Tema</label>
                <input className="form-control" {...register('tema')} />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Fecha *</label>
                  <input type="date" className="form-control" {...register('fecha')} />
                </div>
                <div className="col-3">
                  <label className="form-label">Inicio *</label>
                  <input type="time" className="form-control" {...register('horaInicio')} />
                </div>
                <div className="col-3">
                  <label className="form-label">Término *</label>
                  <input type="time" className="form-control" {...register('horaTermino')} />
                </div>
              </div>
              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Aula *</label>
                  <input className="form-control" {...register('aula')} />
                </div>
                <div className="col-6">
                  <label className="form-label">Horas *</label>
                  <input type="number" min={1} max={12} className="form-control" {...register('numeroHoras')} />
                </div>
              </div>
              <div className="row g-2 mt-1">
                <div className="col-6">
                  <label className="form-label">Firma inicio</label>
                  <input className="form-control" {...register('firma')} />
                </div>
                <div className="col-6">
                  <label className="form-label">Firma término</label>
                  <input className="form-control" {...register('firmaTermino')} />
                </div>
              </div>
              <div className="mt-2">
                <label className="form-label">Observaciones</label>
                <textarea className="form-control" rows={2} {...register('observaciones')} />
              </div>
              <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="card page-card p-3">
            <h5 className="mb-3">Últimos registros</h5>
            <div className="table-responsive" style={{ maxHeight: 600 }}>
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Docente</th>
                    <th>Asignatura</th>
                    <th>Horas</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td>{new Date(c.fecha).toLocaleDateString('es-PE')}</td>
                      <td>{c.docente ? `${c.docente.apellidos}, ${c.docente.nombres}` : '-'}</td>
                      <td>{c.asignatura}</td>
                      <td>{c.numeroHoras}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => navigate(`/clases/${c.id}/editar`)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
