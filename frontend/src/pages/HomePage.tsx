import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="row g-4">
      <div className="col-12">
        <div className="card page-card p-4 p-md-5">
          <div className="row g-4 align-items-center">
            <div className="col-md-7">
              <span className="section-title">Formulario de asistencia</span>
              <h2 className="mt-2 mb-3">Registra tus clases, docentes y justificaciones</h2>
              <p className="text-secondary mb-4">
                Plataforma integral para el control de asistencia y horas dictadas en el Centro Preuniversitario de la
                UNAMBA. Accede a los formularios o ingresa a tu panel personalizado.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/docentes/crear" className="btn btn-primary">
                  <i className="bi bi-person-plus me-1" /> Registrar docente
                </Link>
                <Link to="/clases/crear" className="btn btn-info">
                  <i className="bi bi-clock-history me-1" /> Registrar clase
                </Link>
                <Link to="/justificaciones/crear" className="btn btn-outline-primary">
                  <i className="bi bi-file-earmark-text me-1" /> Justificar permiso
                </Link>
              </div>
            </div>
            <div className="col-md-5 text-center">
              <img src="/logo-cpu-unamba.jpeg" alt="Logo CPU" className="img-fluid" style={{ maxHeight: 220 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4">
        <div className="card page-card p-4 h-100">
          <span className="section-title">Acceso administrador</span>
          <h5 className="mt-2">Panel de gestión</h5>
          <p className="text-secondary">Administra docentes, clases, justificaciones y reportes.</p>
          <Link to="/login" className="btn btn-primary w-100">
            <i className="bi bi-shield-lock-fill me-1" /> Ingresar
          </Link>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card page-card p-4 h-100">
          <span className="section-title">Acceso docente</span>
          <h5 className="mt-2">Panel del docente</h5>
          <p className="text-secondary">Registra tus clases, consulta tus horas y actualiza tu información.</p>
          <Link to="/docente/login" className="btn btn-info w-100">
            <i className="bi bi-person-badge me-1" /> Ingresar
          </Link>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card page-card p-4 h-100">
          <span className="section-title">Reportes</span>
          <h5 className="mt-2">Registros de clases</h5>
          <p className="text-secondary">Consulta el listado completo de clases dictadas.</p>
          <Link to="/clases" className="btn btn-outline-primary w-100">
            <i className="bi bi-table me-1" /> Ver registros
          </Link>
        </div>
      </div>
    </div>
  );
}
