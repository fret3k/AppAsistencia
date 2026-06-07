import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function PublicLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const active = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <>
      <header>
        <nav className="navbar navbar-expand-lg main-menu navbar-dark">
          <div className="container">
            <button
              className="navbar-toggler my-2"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#mainNav"
              aria-controls="mainNav"
              aria-expanded="false"
              aria-label="Abrir navegación"
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className="collapse navbar-collapse" id="mainNav">
              <div className="navbar-nav mx-auto gap-lg-4">
                <Link className={`nav-link ${active('/docentes/crear') ? 'active fw-bold' : ''}`} to="/docentes/crear">
                  <i className="bi bi-person-plus me-1" /> Registrar docente
                </Link>
                <Link className={`nav-link ${active('/clases/crear') ? 'active fw-bold' : ''}`} to="/clases/crear">
                  <i className="bi bi-clock-history me-1" /> Registrar clase
                </Link>
                <Link className={`nav-link ${active('/justificaciones/crear') ? 'active fw-bold' : ''}`} to="/justificaciones/crear">
                  <i className="bi bi-file-earmark-text me-1" /> Justificación
                </Link>
                <Link className={`nav-link ${active('/clases') && !location.pathname.includes('crear') ? 'active fw-bold' : ''}`} to="/clases">
                  <i className="bi bi-table me-1" /> Registros
                </Link>
              </div>
              <div className="navbar-nav ms-auto gap-lg-2 align-items-lg-center">
                {user?.role === 'admin' && !active('/docentes/crear') && (
                  <Link className="btn btn-info btn-sm px-3 py-2 text-dark fw-bold rounded-pill" to="/admin/dashboard">
                    <i className="bi bi-shield-lock-fill me-1" /> Panel Admin
                  </Link>
                )}
                {user ? (
                  <>
                    <span className="nav-link text-muted d-flex align-items-center gap-1 ms-lg-3">
                      <i className="bi bi-person-circle" /> {user.email}
                    </span>
                    <button
                      className="nav-link border-0 bg-transparent"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                    >
                      <i className="bi bi-box-arrow-right" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="nav-link admin-login-link me-2" to="/docente/login" title="Acceso Docente">
                      <i className="bi bi-person-badge" /> Docente Login
                    </Link>
                    <Link className="nav-link admin-login-link" to="/login" title="Acceso Administrador">
                      <i className="bi bi-lock" /> Admin Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <section className="hero-band">
          <div className="hero-shell py-4">
            <div className="row align-items-center g-3">
              <div className="col-lg-8">
                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3">
                  <img className="hero-logo" src="/logo-cpu-unamba.jpeg" alt="Logo CPU UNAMBA" />
                  <div>
                    <h1 className="display-3 mb-3">
                      CENTRO
                      <br />
                      PREUNIVERSITARIO
                    </h1>
                    <p className="lead mb-0">Sistema de control de asistencia y horas dictadas.</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end">
                <span className="hero-badge">
                  <i className="bi bi-calendar-check" /> Registro académico
                </span>
              </div>
            </div>
          </div>
        </section>
      </header>
      <main className="container py-4 py-lg-5">
        <Outlet />
      </main>
    </>
  );
}
