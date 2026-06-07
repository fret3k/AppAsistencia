import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docentes } from '@/lib/services';
import type { Docente } from '@/types';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/lib/api';

export function DocentesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Docente[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await docentes.list(q || undefined);
      setItems(data);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (d: Docente) => {
    const r = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar docente?',
      text: `${d.apellidos}, ${d.nombres} (DNI ${d.dni})`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
    });
    if (!r.isConfirmed) return;
    try {
      await docentes.remove(d.id);
      toast.success('Docente eliminado');
      load();
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Docentes</h3>
        <Link to="/docentes/crear" className="btn btn-primary">
          <i className="bi bi-person-plus me-1" /> Nuevo docente
        </Link>
      </div>
      <div className="card page-card p-3">
        <div className="row g-2 mb-3">
          <div className="col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-search" /></span>
              <input
                className="form-control"
                placeholder="Buscar por nombre o apellido"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
              <button className="btn btn-outline-primary" onClick={load}>Buscar</button>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Docente</th>
                <th>DNI</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Especialidad</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="spinner-border" role="status" />
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-secondary py-4">No hay docentes registrados.</td>
                </tr>
              )}
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="fw-semibold">{d.apellidos}, {d.nombres}</td>
                  <td>{d.dni}</td>
                  <td>{d.correo || '-'}</td>
                  <td>{d.telefono || '-'}</td>
                  <td>{d.especialidad || '-'}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      {user?.role === 'admin' && (
                        <button className="btn btn-outline-primary" onClick={() => navigate(`/docentes/${d.id}/editar`)}>
                          <i className="bi bi-pencil" /> Editar
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button className="btn btn-outline-danger" onClick={() => handleDelete(d)}>
                          <i className="bi bi-trash" />
                        </button>
                      )}
                    </div>
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
