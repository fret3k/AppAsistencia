import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function DocenteLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const display = `${user?.docenteNombres ?? ''} ${user?.docenteApellidos ?? ''}`.trim() || user?.email || 'Docente';
  const initials =
    ((user?.docenteNombres || '?')[0] || '').toUpperCase() +
    ((user?.docenteApellidos || '?')[0] || '').toUpperCase();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar docente-sidebar">
        <div className="admin-sidebar-header">
          <div className="d-flex align-items-center gap-3">
            <img src="/logo-cpu-unamba.jpeg" alt="Logo" className="rounded" style={{ width: 42, height: 42, objectFit: 'contain', background: 'white', padding: 2 }} />
            <div>
              <div className="fw-bold text-white lh-1">CPU UNAMBA</div>
              <small style={{ color: '#34d399', fontSize: '0.75rem', letterSpacing: 0.5 }}>Panel Docente</small>
            </div>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <div className="px-3 mb-2 text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>Principal</div>
          <Link className={`nav-link ${isActive('/docente/dashboard') ? 'active' : ''}`} to="/docente/dashboard">
            <i className="bi bi-speedometer2" /> Dashboard
          </Link>
          <Link className={`nav-link ${isActive('/docente/mis-clases') ? 'active' : ''}`} to="/docente/mis-clases">
            <i className="bi bi-journal-text" /> Mis Clases
          </Link>
          <Link className={`nav-link ${isActive('/docente/mi-perfil') ? 'active' : ''}`} to="/docente/mi-perfil">
            <i className="bi bi-person" /> Mi Perfil
          </Link>

          <div className="px-3 mb-2 mt-4 text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>Acciones</div>
          <Link className="nav-link" to="/clases/crear">
            <i className="bi bi-clock-history" /> Registrar Clase
          </Link>
          <Link className="nav-link" to="/justificaciones/crear">
            <i className="bi bi-file-earmark-text" /> Justificar Permiso
          </Link>
        </nav>
        <div className="p-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
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
        <header className="admin-topbar docente-topbar">
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              <i className="bi bi-calendar3 me-1" /> {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <div className="d-flex align-items-center gap-2 border-start ps-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white" style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#059669,#0891b2)' }}>
                {initials}
              </div>
              <span className="fw-semibold text-dark">{display}</span>
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
