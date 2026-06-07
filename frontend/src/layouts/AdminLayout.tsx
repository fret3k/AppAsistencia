import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { admin, notificaciones } from '@/lib/services';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await notificaciones.list();
      setCount(data.total);
      setItems(data.notifs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeMenu = () => setOpen(false);

  const handleLeer = async (id: number) => {
    try {
      await notificaciones.leer(id);
      await load();
    } catch {
      toast.error('No se pudo marcar como leída');
    }
  };

  const handleClickItem = async (n: any) => {
    closeMenu();
    const j = n.justificacion;
    await handleLeer(n.id);
    if (!j) return;
    const archivoUrl = j.archivoPath ? `/api/justificaciones/${j.id}/archivo` : '';
    const fileHtml = archivoUrl
      ? `<a class="btn btn-primary mt-3" href="${archivoUrl}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right me-1"></i> Ver / descargar archivo</a>`
      : '<span class="badge text-bg-secondary mt-3">Sin archivo adjunto</span>';
    await Swal.fire({
      title: 'Justificación de permiso',
      html: `<div class="text-start">
          <div class="row g-2">
            <div class="col-sm-4"><strong>DNI:</strong><br>${j.dni || ''}</div>
            <div class="col-sm-8"><strong>Nombres y apellidos:</strong><br>${j.nombres || ''} ${j.apellidos || ''}</div>
            <div class="col-sm-4"><strong>Teléfono:</strong><br>${j.telefono || ''}</div>
            <div class="col-sm-5"><strong>Clase a dictar:</strong><br>${j.claseADictar || ''}</div>
            <div class="col-sm-3"><strong>Aula:</strong><br>${j.aula || ''}</div>
            <div class="col-12"><strong>Motivo de permiso:</strong><br>${j.motivo || ''}</div>
            <div class="col-12"><strong>Archivo:</strong><br>${j.archivoNombre || 'Sin archivo'}</div>
          </div>
          ${fileHtml}
        </div>`,
      width: 760,
      confirmButtonColor: 'var(--cpu-navy)',
      confirmButtonText: 'Cerrar',
    });
  };

  const handleLeerTodas = async () => {
    try {
      await notificaciones.leerTodas();
      await load();
      toast.success('Notificaciones marcadas como leídas');
    } catch {
      toast.error('No se pudo actualizar');
    }
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = (user?.email || 'A').charAt(0).toUpperCase();

  const handleToggleHours = async () => {
    try {
      const data = await admin.toggleWorkingHours();
      toast.success(data.message || 'Horario actualizado');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Error al cambiar horario');
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="d-flex align-items-center gap-3">
            <img src="/logo-cpu-unamba.jpeg" alt="Logo" className="rounded" style={{ width: 42, height: 42, objectFit: 'contain', background: 'white', padding: 2 }} />
            <div>
              <div className="fw-bold text-white lh-1">CPU UNAMBA</div>
              <small style={{ color: 'var(--cpu-cyan)', fontSize: '0.75rem', letterSpacing: 0.5 }}>Panel Admin</small>
            </div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <div className="px-3 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>Principal</div>
          <Link className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">
            <i className="bi bi-speedometer2" /> Dashboard
          </Link>

          <div className="px-3 mb-2 mt-4 text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>Gestión</div>
          <Link className={`nav-link ${isActive('/admin/horas-dictadas') ? 'active' : ''}`} to="/admin/horas-dictadas">
            <i className="bi bi-pencil-square" /> Administrar Horas
          </Link>
          <Link className={`nav-link ${isActive('/justificaciones') && !location.pathname.endsWith('/crear') ? 'active' : ''}`} to="/justificaciones">
            <i className="bi bi-file-earmark-text" /> Justificaciones
          </Link>
          <Link className={`nav-link ${isActive('/docentes') ? 'active' : ''}`} to="/docentes">
            <i className="bi bi-people" /> Gestionar Docentes
          </Link>
          <Link className={`nav-link ${isActive('/clases') && !location.pathname.includes('exportar') ? 'active' : ''}`} to="/clases">
            <i className="bi bi-journal-text" /> Todas las Clases
          </Link>

          <div className="px-3 mb-2 mt-4 text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>Reportes</div>
          <Link className={`nav-link ${isActive('/admin/reportes/horas-docentes') ? 'active' : ''}`} to="/admin/reportes/horas-docentes">
            <i className="bi bi-bar-chart-line" /> Reporte de Horas
          </Link>
          <button className="nav-link border-0 bg-transparent text-start" onClick={() => downloadExcel('teacher-hours', 'reporte-horas-docentes')}>
            <i className="bi bi-file-earmark-excel" /> Exportar Horas (Excel)
          </button>
          <button className="nav-link border-0 bg-transparent text-start" onClick={() => downloadExcel('clases', 'registro-clases')}>
            <i className="bi bi-download" /> Exportar Clases (Excel)
          </button>
        </nav>
        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
          <button className="btn btn-outline-light btn-sm w-100 mb-2 py-2" onClick={handleToggleHours}>
            <i className="bi bi-clock me-1" /> {`Horario laborable ON/OFF`}
          </button>
          <Link to="/" className="btn btn-outline-light btn-sm w-100 mb-2 py-2">
            <i className="bi bi-globe me-1" /> Ir a Web Pública
          </Link>
          <button
            className="btn btn-danger btn-sm w-100 py-2"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            <i className="bi bi-box-arrow-right me-1" /> Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-calendar3 me-1" /> {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <div className="dropdown border-start ps-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="notif-bell border-0 bg-transparent"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
              >
                <i className="bi bi-bell-fill" />
                {count > 0 && <span className="notif-badge">{count > 99 ? '99+' : count}</span>}
              </button>
              {open && (
                <div className="dropdown-menu dropdown-menu-end notif-dropdown show" style={{ position: 'absolute', right: 0, top: '100%' }}>
                  <div className="notif-header">
                    <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
                      <i className="bi bi-bell me-1" /> Notificaciones
                    </span>
                    {count > 0 && (
                      <button className="btn btn-sm btn-link text-decoration-none p-0" style={{ fontSize: '0.8rem' }} onClick={handleLeerTodas}>
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div className="notif-empty">
                      <i className="bi bi-bell-slash" style={{ fontSize: '2rem', display: 'block', marginBottom: 8, color: '#d1d5db' }} />
                      No hay notificaciones nuevas
                    </div>
                  ) : (
                    items.map((n) => (
                      <div key={n.id} className="notif-item" onClick={() => handleClickItem(n)}>
                        <div className="d-flex align-items-start gap-2">
                          <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ width: 32, height: 32, background: 'rgba(239,68,68,.1)' }}>
                            <i className="bi bi-file-earmark-text" style={{ color: '#ef4444', fontSize: '0.9rem' }} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{n.titulo}</div>
                            <div className="text-secondary" style={{ fontSize: '0.8rem', lineHeight: 1.3 }}>{n.mensaje}</div>
                            <div className="text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-clock me-1" />{new Date(n.createdAt).toLocaleString('es-PE')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2 border-start ps-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36, background: 'rgba(4,95,214,.1)', color: 'var(--cpu-blue)' }}>
                {initials}
              </div>
              <span className="fw-semibold text-dark">{user?.email}</span>
            </div>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

async function downloadExcel(kind: 'clases' | 'teacher-hours', base: string) {
  const { downloadFile } = await import('@/lib/services');
  const filename = `${base}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  try {
    if (kind === 'clases') await downloadFile('/exports/clases', filename);
    else await downloadFile('/exports/teacher-hours', filename);
    toast.success('Descarga iniciada');
  } catch {
    toast.error('Error al descargar');
  }
}
