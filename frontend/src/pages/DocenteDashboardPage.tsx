import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clases } from '@/lib/services';
import type { Clase } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

interface DashboardData {
  totalClases: number;
  totalHoras: number;
  horasMes: number;
  totalAsignaturas: number;
  ultimasClases: Clase[];
  horasPorMes: Array<{ periodo: string; total: number }>;
}

export function DocenteDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const load = async () => {
    try {
      const r = await clases.misClases();
      const all = r.clases;
      const totalClases = all.length;
      const totalHoras = r.totalHoras;
      const mes = new Date().toISOString().slice(0, 7);
      const horasMes = all.filter((c) => c.fecha.slice(0, 7) === mes).reduce((a, c) => a + c.numeroHoras, 0);
      const asignaturas = new Set(all.map((c) => c.asignatura));
      const ultimas = [...all].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);
      // Agrupar horas por mes
      const map: Record<string, number> = {};
      all.forEach((c) => {
        const k = c.fecha.slice(0, 7);
        map[k] = (map[k] ?? 0) + c.numeroHoras;
      });
      const horasPorMes = Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([periodo, total]) => ({ periodo, total }));
      setData({ totalClases, totalHoras, horasMes, totalAsignaturas: asignaturas.size, ultimasClases: ultimas, horasPorMes });
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  useEffect(() => { load(); }, []);

  if (!data) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h3 className="mb-1">Bienvenido, {user?.docenteNombres}</h3>
      <p className="text-secondary mb-4">Resumen de tu actividad docente</p>

      <div className="row g-3 mb-4">
        <Stat label="Clases" value={data.totalClases} icon="bi-journal-text" color="primary" />
        <Stat label="Horas totales" value={data.totalHoras} icon="bi-clock-fill" color="info" />
        <Stat label="Horas este mes" value={data.horasMes} icon="bi-calendar-check" color="success" />
        <Stat label="Asignaturas" value={data.totalAsignaturas} icon="bi-book" color="warning" />
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card page-card p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Últimas clases</h5>
              <Link to="/docente/mis-clases" className="btn btn-sm btn-outline-primary">Ver todas</Link>
            </div>
            <ul className="list-group list-group-flush">
              {data.ultimasClases.map((c) => (
                <li key={c.id} className="list-group-item d-flex justify-content-between">
                  <div>
                    <div className="fw-semibold">{c.asignatura}</div>
                    <div className="small text-secondary">{c.tema || '-'}</div>
                  </div>
                  <div className="text-end small text-secondary">
                    {new Date(c.fecha).toLocaleDateString('es-PE')}<br />
                    {c.horaInicio.slice(0, 5)} - {c.horaTermino.slice(0, 5)} | {c.numeroHoras} h
                  </div>
                </li>
              ))}
              {data.ultimasClases.length === 0 && <li className="list-group-item text-secondary">Aún no has registrado clases.</li>}
            </ul>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card page-card p-3 h-100">
            <h5>Horas por mes</h5>
            <ul className="list-group list-group-flush">
              {[...data.horasPorMes].reverse().map((m) => (
                <li key={m.periodo} className="list-group-item d-flex justify-content-between">
                  <span>{m.periodo}</span>
                  <strong>{m.total} h</strong>
                </li>
              ))}
            </ul>
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
