import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clases, downloadFile } from '@/lib/services';
import type { Clase } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

export function ClasesListPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Clase[]>([]);
  const [meses, setMeses] = useState<Array<{ periodo: string; totalHoras: number; totalClases: number }>>([]);
  const [mes, setMes] = useState<string>('');
  const [totalHoras, setTotalHoras] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async (m?: string) => {
    setLoading(true);
    try {
      const data = await clases.list(m || undefined);
      setItems(data.clases);
      setTotalHoras(data.totalHoras);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    clases.mesesRegistrados().then(setMeses).catch(() => undefined);
  }, []);

  const handleExport = async () => {
    try {
      const fn = `registro-clases-${mes || new Date().toISOString().slice(0, 10)}.xlsx`;
      await downloadFile('/exports/clases', fn, mes ? { mes } : {});
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Clases dictadas</h3>
        <div className="d-flex gap-2">
          {user?.role === 'admin' && (
            <button className="btn btn-outline-primary" onClick={handleExport}>
              <i className="bi bi-file-earmark-excel me-1" /> Exportar Excel
            </button>
          )}
          <Link to="/clases/crear" className="btn btn-primary">
            <i className="bi bi-clock-history me-1" /> Nueva clase
          </Link>
        </div>
      </div>
      <div className="card page-card p-3">
        <div className="row g-2 mb-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label small text-secondary mb-1">Filtrar por mes</label>
            <select className="form-select" value={mes} onChange={(e) => { setMes(e.target.value); load(e.target.value); }}>
              <option value="">Todos los meses</option>
              {meses.map((m) => (
                <option key={m.periodo} value={m.periodo}>{m.periodo} ({m.totalClases} clases / {m.totalHoras} h)</option>
              ))}
            </select>
          </div>
          <div className="col-md-8 text-end">
            <span className="badge text-bg-info fs-6 py-2 px-3">Total horas: {totalHoras}</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Docente</th>
                <th>Asignatura</th>
                <th>Tema</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Horas</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border" /></td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="text-center text-secondary py-4">No hay clases registradas.</td></tr>
              )}
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="fw-semibold">{c.docente ? `${c.docente.apellidos}, ${c.docente.nombres}` : '-'}</td>
                  <td>{c.asignatura}</td>
                  <td>{c.tema || '-'}</td>
                  <td>{new Date(c.fecha).toLocaleDateString('es-PE')}</td>
                  <td>{c.horaInicio.slice(0, 5)} - {c.horaTermino.slice(0, 5)}</td>
                  <td>{c.aula}</td>
                  <td>{c.numeroHoras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
