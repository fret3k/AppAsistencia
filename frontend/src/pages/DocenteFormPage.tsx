import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { docentes } from '@/lib/services';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';
import { useEffect, useState } from 'react';

const schema = z.object({
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.'),
  dni: z.string().trim().regex(/^[0-9]{8}$/, 'El DNI debe tener exactamente 8 dígitos numéricos.'),
  correo: z.string().trim().email('Ingresa un correo válido.'),
  telefono: z.string().trim().regex(/^[0-9]{9}$/, 'El teléfono debe tener exactamente 9 dígitos numéricos.'),
  especialidad: z.string().trim().optional(),
});
type FormData = z.infer<typeof schema>;

export function DocenteFormPage() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { especialidad: '' },
  });

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    docentes
      .get(Number(id))
      .then((d) => reset({
        nombres: d.nombres,
        apellidos: d.apellidos,
        dni: d.dni,
        correo: d.correo ?? '',
        telefono: d.telefono ?? '',
        especialidad: d.especialidad ?? '',
      }))
      .catch((err) => toast.error(getApiError(err).message))
      .finally(() => setLoading(false));
  }, [id, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setDuplicateMsg(null);
    try {
      if (isEdit) {
        await docentes.update(Number(id), data);
        toast.success('Docente actualizado');
      } else {
        await docentes.create(data);
        toast.success('Docente registrado');
      }
      navigate('/docentes');
    } catch (err) {
      const apiErr = getApiError(err);
      toast.error(apiErr.message);
      const dups = (apiErr.details as any)?.duplicate;
      if (dups) {
        setDuplicateMsg(Array.isArray(dups) ? dups.join('<br/>') : String(dups));
      }
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <div className="card page-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">{isEdit ? 'Editar docente' : 'Registrar docente'}</h4>
            <Link to="/docentes" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-arrow-left me-1" /> Volver
            </Link>
          </div>
          {loading && <div className="text-center py-3"><div className="spinner-border" /></div>}
          {!loading && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {duplicateMsg && (
                <div className="alert alert-warning" dangerouslySetInnerHTML={{ __html: duplicateMsg }} />
              )}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombres *</label>
                  <input className={`form-control ${errors.nombres ? 'is-invalid' : ''}`} {...register('nombres')} />
                  {errors.nombres && <div className="invalid-feedback">{errors.nombres.message}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellidos *</label>
                  <input className={`form-control ${errors.apellidos ? 'is-invalid' : ''}`} {...register('apellidos')} />
                  {errors.apellidos && <div className="invalid-feedback">{errors.apellidos.message}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label">DNI *</label>
                  <input className={`form-control ${errors.dni ? 'is-invalid' : ''}`} inputMode="numeric" maxLength={8} {...register('dni')} />
                  {errors.dni && <div className="invalid-feedback">{errors.dni.message}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Teléfono *</label>
                  <input className={`form-control ${errors.telefono ? 'is-invalid' : ''}`} inputMode="numeric" maxLength={9} {...register('telefono')} />
                  {errors.telefono && <div className="invalid-feedback">{errors.telefono.message}</div>}
                </div>
                <div className="col-md-4">
                  <label className="form-label">Correo *</label>
                  <input type="email" className={`form-control ${errors.correo ? 'is-invalid' : ''}`} {...register('correo')} />
                  {errors.correo && <div className="invalid-feedback">{errors.correo.message}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">Especialidad</label>
                  <input className="form-control" {...register('especialidad')} />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <Link to="/docentes" className="btn btn-light">Cancelar</Link>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
