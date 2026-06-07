import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Clase, Docente } from '@/types';

export function MiPerfilPage() {
  const { user } = useAuth();
  const [docente, setDocente] = useState<Docente | null>(null);
  const [stats, setStats] = useState({ totalClases: 0, totalHoras: 0, totalAsignaturas: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const d = await api.get<Docente>(`/docentes/${user?.docenteId}`).then((r) => r.data);
        setDocente(d);
        const r = await api.get<{ clases: Clase[]; totalHoras: number }>('/docente/mis-clases').then((x) => x.data);
        setStats({
          totalClases: r.clases.length,
          totalHoras: r.totalHoras,
          totalAsignaturas: new Set(r.clases.map((c) => c.asignatura)).size,
        });
      } catch {
        toast.error('No se pudo cargar el perfil');
      }
    };
    if (user?.docenteId) load();
  }, [user?.docenteId]);

  if (!docente) return <div className="text-center py-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h3 className="mb-4">Mi Perfil</h3>
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card page-card p-4">
            <h5>Datos personales</h5>
            <hr />
            <div className="row g-2">
              <div className="col-sm-4 text-secondary">Nombres</div>
              <div className="col-sm-8 fw-semibold">{docente.nombres}</div>
              <div className="col-sm-4 text-secondary">Apellidos</div>
              <div className="col-sm-8 fw-semibold">{docente.apellidos}</div>
              <div className="col-sm-4 text-secondary">DNI</div>
              <div className="col-sm-8">{docente.dni}</div>
              <div className="col-sm-4 text-secondary">Correo</div>
              <div className="col-sm-8">{docente.correo || '-'}</div>
              <div className="col-sm-4 text-secondary">Teléfono</div>
              <div className="col-sm-8">{docente.telefono || '-'}</div>
              <div className="col-sm-4 text-secondary">Especialidad</div>
              <div className="col-sm-8">{docente.especialidad || '-'}</div>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card page-card p-4 h-100">
            <h5>Mis estadísticas</h5>
            <hr />
            <p className="mb-1 d-flex justify-content-between"><span>Clases totales</span><strong>{stats.totalClases}</strong></p>
            <p className="mb-1 d-flex justify-content-between"><span>Horas totales</span><strong>{stats.totalHoras}</strong></p>
            <p className="mb-0 d-flex justify-content-between"><span>Asignaturas distintas</span><strong>{stats.totalAsignaturas}</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
