import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { DocenteLayout } from './layouts/DocenteLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DocenteLoginPage } from './pages/DocenteLoginPage';
import { DocentesListPage } from './pages/DocentesListPage';
import { DocenteFormPage } from './pages/DocenteFormPage';
import { ClaseCreatePage } from './pages/ClaseCreatePage';
import { ClasesListPage } from './pages/ClasesListPage';
import { ClaseEditPage } from './pages/ClaseEditPage';
import { JustificacionCreatePage } from './pages/JustificacionCreatePage';
import { JustificacionesListPage } from './pages/JustificacionesListPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminHorasPage } from './pages/AdminHorasPage';
import { TeacherHoursReportPage } from './pages/TeacherHoursReportPage';
import { TeacherDetailPage } from './pages/TeacherDetailPage';
import { DocenteDashboardPage } from './pages/DocenteDashboardPage';
import { MisClasesPage } from './pages/MisClasesPage';
import { MiPerfilPage } from './pages/MiPerfilPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<AdminLoginPage />} />
        <Route path="docente/login" element={<DocenteLoginPage />} />
        <Route path="docentes" element={<DocentesListPage />} />
        <Route path="docentes/crear" element={<DocenteFormPage />} />
        <Route path="docentes/:id/editar" element={<DocenteFormPage />} />
        <Route path="clases" element={<ClasesListPage />} />
        <Route path="clases/crear" element={<ClaseCreatePage />} />
        <Route path="clases/:id/editar" element={<ClaseEditPage />} />
        <Route path="justificaciones" element={<JustificacionesListPage />} />
        <Route path="justificaciones/crear" element={<JustificacionCreatePage />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute require="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="horas-dictadas" element={<AdminHorasPage />} />
        <Route path="reportes/horas-docentes" element={<TeacherHoursReportPage />} />
        <Route path="docentes/:id" element={<TeacherDetailPage />} />
      </Route>

      <Route
        path="docente"
        element={
          <ProtectedRoute require="docente">
            <DocenteLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DocenteDashboardPage />} />
        <Route path="mis-clases" element={<MisClasesPage />} />
        <Route path="mi-perfil" element={<MiPerfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
