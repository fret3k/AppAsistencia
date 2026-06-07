import { useEffect, useState } from 'react';
import { admin as adminApi, downloadFile } from '@/lib/services';
import type { TeacherHoursReport } from '@/types';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

export function TeacherHoursReportPage() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<TeacherHoursReport | null>(null);

  const load = async (search?: string) => {
    try {
      const r = await adminApi.teacherHoursReport(search);
      setData(r);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    try {
      await downloadFile('/exports/teacher-hours', `reporte-horas-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar');
    }
  };

  const monthCount = data?.meses.length ?? 0;

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Reporte de horas por docente</h3>
        <button className="btn btn-outline-primary" onClick={handleExport}>
          <i className="bi bi-file-earmark-excel me-1" /> Exportar Excel
        </button>
      </div>
      <div className="card page-card p-3 mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="form-label small">Buscar docente</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn btn-primary" onClick={() => load(q)}>Buscar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="card page-card p-3">
        <div className="table-responsive">
          <table className="table report-table align-middle">
            <thead>
              <tr>
                <th>Docente</th>
                {data?.meses.map((m) => <th key={m}>{m}</th>)}
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!data && <tr><td colSpan={monthCount + 2} className="text-center py-4"><div className="spinner-border" /></td></tr>}
              {data && data.docentes.length === 0 && (
                <tr><td colSpan={monthCount + 2} className="text-center text-secondary py-4">No hay datos.</td></tr>
              )}
              {data?.docentes.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link to={`/admin/docentes/${d.id}`} className="fw-semibold text-decoration-none">
                      {d.apellidos}, {d.nombres}
                    </Link>
                  </td>
                  {data.meses.map((m) => <td key={m} className="text-center">{d.horas[m] ?? '-'}</td>)}
                  <td className="text-center fw-bold">{d.total}</td>
                  <td className="text-end">
                    <Link className="btn btn-sm btn-outline-primary" to={`/admin/docentes/${d.id}`}>
                      <i className="bi bi-eye" /> Detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
