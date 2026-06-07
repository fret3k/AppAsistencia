import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clases } from '@/lib/services';
import type { Clase } from '@/types';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

export function MisClasesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Clase[]>([]);
  const [meses, setMeses] = useState<string[]>([]);
  const [mes, setMes] = useState('');
  const [totalHoras, setTotalHoras] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = async (m?: string) => {
    setLoading(true);
    try {
      const data = await clases.misClases(m);
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
    // Cargar meses disponibles a partir de los registros
    clases.misClases().then((d) => {
      const set = new Set<string>();
      d.clases.forEach((c) => set.add(c.fecha.slice(0, 7)));
      setMeses(Array.from(set).sort().reverse());
    }).catch(() => undefined);
  }, []);

  const handleDelete = async (id: number) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar clase?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!r.isConfirmed) return;
    try {
      await clases.remove(id);
      toast.success('Clase eliminada');
      load(mes);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Mis Clases</h3>
        <Link to="/clases/crear" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" /> Registrar clase
        </Link>
      </div>
      <div className="card page-card p-3">
        <div className="row g-2 mb-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label small">Filtrar por mes</label>
            <select className="form-select" value={mes} onChange={(e) => { setMes(e.target.value); load(e.target.value); }}>
              <option value="">Todos</option>
              {meses.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-md-8 text-end">
            <span className="badge text-bg-info fs-6 py-2 px-3">Total horas: {totalHoras}</span>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Asignatura</th>
                <th>Tema</th>
                <th>Horario</th>
                <th>Aula</th>
                <th>Horas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border" /></td></tr>}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="text-center text-secondary py-4">Aún no has registrado clases.</td></tr>
              )}
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleDateString('es-PE')}</td>
                  <td>{c.asignatura}</td>
                  <td>{c.tema || '-'}</td>
                  <td>{c.horaInicio.slice(0, 5)} - {c.horaTermino.slice(0, 5)}</td>
                  <td>{c.aula}</td>
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
  );
}
