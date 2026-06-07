import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadFile, justificaciones } from '@/lib/services';
import type { Justificacion } from '@/types';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

export function JustificacionesListPage() {
  const [items, setItems] = useState<Justificacion[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await justificaciones.list();
      setItems(data.justificaciones);
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    try {
      await downloadFile('/exports/justificaciones', `justificaciones-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Justificaciones</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={handleExport}>
            <i className="bi bi-file-earmark-excel me-1" /> Exportar Excel
          </button>
          <Link to="/justificaciones/crear" className="btn btn-primary">
            <i className="bi bi-plus-lg me-1" /> Nueva justificación
          </Link>
        </div>
      </div>
      <div className="card page-card p-3">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Docente</th>
                <th>DNI</th>
                <th>Tipo</th>
                <th>Clase</th>
                <th>Aula</th>
                <th>Archivo</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-4"><div className="spinner-border" /></td></tr>}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="text-center text-secondary py-4">No hay justificaciones.</td></tr>
              )}
              {items.map((j) => (
                <tr key={j.id}>
                  <td>{new Date(j.fechaJustificacion).toLocaleDateString('es-PE')}</td>
                  <td>{j.docente ? `${j.docente.apellidos}, ${j.docente.nombres}` : `${j.apellidos}, ${j.nombres}`}</td>
                  <td>{j.dni}</td>
                  <td>
                    <span className={`badge ${j.tipo === 'asistencia' ? 'text-bg-info' : 'text-bg-warning'}`}>
                      {j.tipo === 'asistencia' ? 'Asistencia' : 'Permiso'}
                    </span>
                  </td>
                  <td>{j.claseADictar}</td>
                  <td>{j.aula}</td>
                  <td>
                    {j.archivoPath ? (
                      <a className="btn btn-sm btn-outline-primary" href={`/api/justificaciones/${j.id}/archivo`} target="_blank" rel="noreferrer">
                        <i className="bi bi-file-earmark" /> {j.archivoNombre}
                      </a>
                    ) : '-'}
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
