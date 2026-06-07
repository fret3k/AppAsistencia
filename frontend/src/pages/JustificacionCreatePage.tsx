import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { docentes as docentesApi, justificaciones } from '@/lib/services';
import type { Docente } from '@/types';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

const schema = z.object({
  docenteId: z.coerce.number().int().positive().optional(),
  dni: z.string().trim().regex(/^[0-9]{8,15}$/, 'DNI inválido.'),
  nombres: z.string().trim().min(1, 'Nombres obligatorios.'),
  apellidos: z.string().trim().min(1, 'Apellidos obligatorios.'),
  telefono: z.string().trim().regex(/^[0-9]{6,15}$/, 'Teléfono inválido.'),
  tipo: z.enum(['permiso', 'asistencia']),
  motivo: z.string().trim().min(1, 'Motivo obligatorio.'),
  claseADictar: z.string().trim().min(1, 'Clase a dictar obligatoria.'),
  aula: z.string().trim().min(1, 'Aula obligatoria.'),
  fechaJustificacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
});
type FormData = z.infer<typeof schema>;

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp';
const MAX_MB = 8;

export function JustificacionCreatePage() {
  const navigate = useNavigate();
  const [docentesList, setDocentesList] = useState<Docente[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [archivoError, setArchivoError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fechaJustificacion: new Date().toISOString().slice(0, 10),
      tipo: 'permiso',
    },
  });

  useEffect(() => { docentesApi.list().then(setDocentesList).catch(() => undefined); }, []);

  // Autocompletar desde docente seleccionado
  const docenteId = watch('docenteId');
  useEffect(() => {
    if (!docenteId) return;
    const d = docentesList.find((x) => x.id === Number(docenteId));
    if (d) {
      setValue('dni', d.dni);
      setValue('nombres', d.nombres);
      setValue('apellidos', d.apellidos);
      setValue('telefono', d.telefono ?? '');
    }
  }, [docenteId, docentesList, setValue]);

  const handleFile = (f: File | null) => {
    setArchivoError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPT.split(',').includes(ext)) {
      setArchivoError('Tipo de archivo no permitido. Use PDF, Word o imagen.');
      setFile(null);
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      setArchivoError(`El archivo no debe superar los ${MAX_MB} MB.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const onSubmit = async (data: FormData) => {
    if (!file) {
      setArchivoError('Sube un documento Word, PDF o imagen.');
      return;
    }
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') fd.append(k, String(v));
      });
      fd.append('archivo', file);
      await justificaciones.create(fd);
      toast.success('Justificación registrada');
      navigate('/justificaciones');
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <div className="card page-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Justificación de permiso</h4>
            <Link to="/justificaciones" className="btn btn-sm btn-outline-secondary">Volver</Link>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Docente (opcional)</label>
                <select className="form-select" {...register('docenteId')}>
                  <option value="">Sin docente específico</option>
                  {docentesList.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">DNI *</label>
                <input className={`form-control ${errors.dni ? 'is-invalid' : ''}`} inputMode="numeric" {...register('dni')} />
                {errors.dni && <div className="invalid-feedback">{errors.dni.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Teléfono *</label>
                <input className={`form-control ${errors.telefono ? 'is-invalid' : ''}`} inputMode="numeric" {...register('telefono')} />
                {errors.telefono && <div className="invalid-feedback">{errors.telefono.message}</div>}
              </div>
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
              <div className="col-md-3">
                <label className="form-label">Tipo *</label>
                <select className="form-select" {...register('tipo')}>
                  <option value="permiso">Permiso</option>
                  <option value="asistencia">Asistencia a clase</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Fecha *</label>
                <input type="date" className={`form-control ${errors.fechaJustificacion ? 'is-invalid' : ''}`} {...register('fechaJustificacion')} />
                {errors.fechaJustificacion && <div className="invalid-feedback">{errors.fechaJustificacion.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Clase a dictar *</label>
                <input className={`form-control ${errors.claseADictar ? 'is-invalid' : ''}`} {...register('claseADictar')} />
                {errors.claseADictar && <div className="invalid-feedback">{errors.claseADictar.message}</div>}
              </div>
              <div className="col-md-3">
                <label className="form-label">Aula *</label>
                <input className={`form-control ${errors.aula ? 'is-invalid' : ''}`} {...register('aula')} />
                {errors.aula && <div className="invalid-feedback">{errors.aula.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Motivo *</label>
                <textarea className={`form-control ${errors.motivo ? 'is-invalid' : ''}`} rows={3} {...register('motivo')} />
                {errors.motivo && <div className="invalid-feedback">{errors.motivo.message}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Archivo (PDF, Word o imagen, máx {MAX_MB} MB) *</label>
                <input
                  type="file"
                  className={`form-control ${archivoError ? 'is-invalid' : ''}`}
                  accept={ACCEPT}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {archivoError && <div className="invalid-feedback d-block">{archivoError}</div>}
                {file && <div className="form-text">Archivo: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</div>}
              </div>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Link to="/justificaciones" className="btn btn-light">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Registrar justificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
