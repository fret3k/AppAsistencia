import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin as adminApi, downloadFile } from '@/lib/services';
import type { DashboardData } from '@/types';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<{ enabled: boolean; start: string; end: string; within: boolean } | null>(null);

  const load = async () => {
    try {
      const [d, s] = await Promise.all([adminApi.dashboard(), adminApi.getSettings()]);
      setData(d);
      setSettings(s);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  useEffect(() => { load(); }, []);

  const { register, handleSubmit, reset } = useForm<{ start: string; end: string }>({
    defaultValues: { start: '13:00', end: '23:59' },
  });

  useEffect(() => {
    if (settings) reset({ start: settings.start, end: settings.end });
  }, [settings, reset]);

  const onUpdateHours = async (form: { start: string; end: string }) => {
    try {
      await adminApi.updateWorkingHours(form.start, form.end);
      toast.success('Horario laborable actualizado');
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const onToggle = async () => {
    try {
      const r = await adminApi.toggleWorkingHours();
      toast.success(r.message);
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  const handleExportTeacher = async (id: number, nombre: string, apellido: string) => {
    try {
      await downloadFile(
        `/exports/teacher-detail/${id}`,
        `detalle-${apellido.toLowerCase()}-${nombre.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar');
    }
  };

  if (!data) {
    return <div className="text-center py-5"><div className="spinner-border" /></div>;
  }

  return (
    <div>
      <h3 className="mb-4">Panel de Administración</h3>

      <div className="row g-3 mb-4">
        <Stat label="Docentes" value={data.totalDocentes} icon="bi-people-fill" color="primary" />
        <Stat label="Clases" value={data.totalClases} icon="bi-journal-text" color="info" />
        <Stat label="Horas totales" value={data.totalHoras} icon="bi-clock-fill" color="success" />
        <Stat label={`Horas ${data.mesActual}`} value={data.horasMesActual} icon="bi-calendar-check" color="warning" />
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card page-card p-3 h-100">
            <h5 className="mb-3">Top 5 docentes por horas</h5>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Docente</th>
                    <th>Horas</th>
                    <th>Clases</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topDocentes.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="fw-semibold">{d.apellidos}, {d.nombres}</div>
                        <div className="text-secondary small">{d.especialidad || '-'}</div>
                      </td>
                      <td>{d.totalHoras}</td>
                      <td>{d.totalClases}</td>
                      <td className="text-end">
                        <Link to={`/admin/docentes/${d.id}`} className="btn btn-sm btn-outline-primary me-1">
                          <i className="bi bi-eye" />
                        </Link>
                        <button className="btn btn-sm btn-outline-success" onClick={() => handleExportTeacher(d.id, d.nombres, d.apellidos)}>
                          <i className="bi bi-file-earmark-excel" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card page-card p-3 h-100">
            <h5 className="mb-3">Últimas clases</h5>
            <ul className="list-group list-group-flush">
              {data.ultimasClases.map((c) => (
                <li key={c.id} className="list-group-item d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">{c.asignatura}</div>
                    <div className="small text-secondary">{c.docente ? `${c.docente.apellidos}, ${c.docente.nombres}` : ''}</div>
                  </div>
                  <div className="text-end small text-secondary">
                    {new Date(c.fecha).toLocaleDateString('es-PE')}<br />
                    {c.horaInicio.slice(0, 5)} - {c.horaTermino.slice(0, 5)}
                  </div>
                </li>
              ))}
              {data.ultimasClases.length === 0 && <li className="list-group-item text-secondary">Sin clases registradas.</li>}
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card page-card p-3 h-100">
            <h5 className="mb-3">Horario laborable</h5>
            <p className="small text-secondary mb-3">
              {settings?.enabled
                ? `Activado. Sólo se pueden registrar clases entre ${settings.start} y ${settings.end}.`
                : 'Desactivado. Se pueden registrar clases a cualquier hora.'}
            </p>
            <form className="row g-2 align-items-end" onSubmit={handleSubmit(onUpdateHours)}>
              <div className="col-4">
                <label className="form-label small">Inicio</label>
                <input type="time" className="form-control" {...register('start')} />
              </div>
              <div className="col-4">
                <label className="form-label small">Término</label>
                <input type="time" className="form-control" {...register('end')} />
              </div>
              <div className="col-4 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">Actualizar</button>
                <button type="button" className="btn btn-outline-secondary" onClick={onToggle}>
                  {settings?.enabled ? 'Apagar' : 'Activar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card page-card p-3 h-100">
            <h5 className="mb-3">Reportes rápidos</h5>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/admin/reportes/horas-docentes" className="btn btn-outline-primary">
                <i className="bi bi-bar-chart-line me-1" /> Reporte horas
              </Link>
              <Link to="/clases" className="btn btn-outline-primary">
                <i className="bi bi-table me-1" /> Ver todas las clases
              </Link>
              <Link to="/justificaciones" className="btn btn-outline-primary">
                <i className="bi bi-file-earmark-text me-1" /> Justificaciones
              </Link>
              <Link to="/docentes" className="btn btn-outline-primary">
                <i className="bi bi-people me-1" /> Docentes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="col-sm-6 col-lg-3">
      <div className="stat p-3 h-100 d-flex justify-content-between align-items-center">
        <div>
          <div className="text-secondary small">{label}</div>
          <div className="fs-3 fw-bold">{value}</div>
        </div>
        <i className={`bi ${icon} fs-1 text-${color}`} />
      </div>
    </div>
  );
}
