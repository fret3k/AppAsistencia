import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { admin as adminApi, downloadFile } from '@/lib/services';
import type { Clase, Docente } from '@/types';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

interface DetailResponse {
  docente: Docente;
  clases: Clase[];
  horasPorMes: Array<{ periodo: string; total: number }>;
  totalHoras: number;
  totalClases: number;
  allMeses: string[];
  selectedMonth: string | null;
}

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [mes, setMes] = useState('');

  const load = async (m?: string) => {
    try {
      const r = await adminApi.teacherDetail(Number(id), m || undefined);
      setData(r);
    } catch (err) {
      toast.error(getApiError(err).message);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleExport = async () => {
    if (!data) return;
    try {
      await downloadFile(
        `/exports/teacher-detail/${id}`,
        `detalle-${data.docente.apellidos.toLowerCase()}-${data.docente.nombres.toLowerCase()}${mes ? '-' + mes : ''}-${new Date().toISOString().slice(0, 10)}.xlsx`,
        mes ? { mes } : {}
      );
      toast.success('Descarga iniciada');
    } catch {
      toast.error('Error al descargar');
    }
  };

  if (!data) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
        <h3 className="mb-0">Detalle: {data.docente.apellidos}, {data.docente.nombres}</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary" onClick={handleExport}>
            <i className="bi bi-file-earmark-excel me-1" /> Exportar Excel
          </button>
          <Link to="/admin/reportes/horas-docentes" className="btn btn-light">Volver</Link>
        </div>
      </div>
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card page-card p-3">
            <h5>Datos del docente</h5>
            <p className="mb-1"><strong>DNI:</strong> {data.docente.dni}</p>
            <p className="mb-1"><strong>Correo:</strong> {data.docente.correo || '-'}</p>
            <p className="mb-1"><strong>Teléfono:</strong> {data.docente.telefono || '-'}</p>
            <p className="mb-0"><strong>Especialidad:</strong> {data.docente.especialidad || '-'}</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card page-card p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Resumen</h5>
              <select className="form-select form-select-sm w-auto" value={mes} onChange={(e) => { setMes(e.target.value); load(e.target.value); }}>
                <option value="">Todos los meses</option>
                {data.allMeses.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <p className="mb-1"><strong>Total de clases:</strong> {data.totalClases}</p>
            <p className="mb-0 fs-4 text-primary fw-bold">Total horas: {data.totalHoras}</p>
          </div>
        </div>
      </div>
      <div className="card page-card p-3">
        <h5>Clases registradas</h5>
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
              </tr>
            </thead>
            <tbody>
              {data.clases.length === 0 && <tr><td colSpan={6} className="text-center text-secondary py-4">Sin clases en este periodo.</td></tr>}
              {data.clases.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha).toLocaleDateString('es-PE')}</td>
                  <td>{c.asignatura}</td>
                  <td>{c.tema || '-'}</td>
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
