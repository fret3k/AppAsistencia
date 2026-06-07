import { api } from './api';
import type {
  AuthResponse,
  AuthUser,
  Clase,
  DashboardData,
  Docente,
  Justificacion,
  Notificacion,
  TeacherHoursReport,
} from '@/types';

export const auth = {
  adminLogin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/admin/login', { email, password }).then((r) => r.data),
  docenteLogin: (dni: string, password: string) =>
    api.post<AuthResponse>('/auth/docente/login', { dni, password }).then((r) => r.data),
  me: () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user),
};

export const docentes = {
  list: (q?: string) =>
    api.get<Docente[]>('/docentes', { params: q ? { q } : {} }).then((r) => r.data),
  get: (id: number) => api.get<Docente>(`/docentes/${id}`).then((r) => r.data),
  create: (data: Partial<Docente>) => api.post<Docente>('/docentes', data).then((r) => r.data),
  update: (id: number, data: Partial<Docente>) =>
    api.put<Docente>(`/docentes/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/docentes/${id}`).then(() => undefined),
};

export const clases = {
  list: (mes?: string) =>
    api
      .get<{ clases: Clase[]; totalHoras: number; selectedMonth: string | null }>('/clases', {
        params: mes ? { mes } : {},
      })
      .then((r) => r.data),
  get: (id: number) => api.get<Clase>(`/clases/${id}`).then((r) => r.data),
  create: (data: Partial<Clase>) => api.post<Clase>('/clases', data).then((r) => r.data),
  update: (id: number, data: Partial<Clase>) =>
    api.put<Clase>(`/clases/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/clases/${id}`).then(() => undefined),
  mesesRegistrados: () =>
    api
      .get<Array<{ periodo: string; totalHoras: number; totalClases: number }>>('/clases/meses')
      .then((r) => r.data),
  misClases: (periodo?: string) =>
    api
      .get<{ clases: Clase[]; totalHoras: number; periodo: string | null }>('/docente/mis-clases', {
        params: periodo ? { periodo } : {},
      })
      .then((r) => r.data),
  clasesDocente: (docenteId: number, mes?: string) =>
    api
      .get<Clase[]>(`/admin/docentes/${docenteId}/clases`, { params: mes ? { mes } : {} })
      .then((r) => r.data),
};

export const justificaciones = {
  list: () =>
    api
      .get<{ justificaciones: Justificacion[]; total: number }>('/justificaciones')
      .then((r) => r.data),
  get: (id: number) => api.get<Justificacion>(`/justificaciones/${id}`).then((r) => r.data),
  create: (form: FormData) =>
    api
      .post<Justificacion>('/justificaciones', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
};

export const notificaciones = {
  list: () =>
    api
      .get<{ notifs: Notificacion[]; total: number }>('/notificaciones')
      .then((r) => r.data),
  leer: (id: number) => api.post(`/notificaciones/${id}/leer`).then((r) => r.data),
  leerTodas: () => api.post('/notificaciones/leer-todas').then((r) => r.data),
};

export const admin = {
  dashboard: () => api.get<DashboardData>('/admin/dashboard').then((r) => r.data),
  teacherHoursReport: (search?: string) =>
    api
      .get<TeacherHoursReport>('/admin/reportes/horas-docentes', { params: search ? { search } : {} })
      .then((r) => r.data),
  teacherDetail: (id: number, mes?: string) =>
    api
      .get(`/admin/docentes/${id}`, { params: mes ? { mes } : {} })
      .then((r) => r.data),
  getSettings: () =>
    api
      .get<{ enabled: boolean; start: string; end: string; within: boolean }>('/admin/settings')
      .then((r) => r.data),
  toggleWorkingHours: () => api.post('/admin/settings/toggle-working-hours').then((r) => r.data),
  updateWorkingHours: (start: string, end: string) =>
    api.post('/admin/settings/update-working-hours', { start, end }).then((r) => r.data),
};

export function exportUrl(path: string, params?: Record<string, string | undefined>): string {
  const token = localStorage.getItem('token') || '';
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') search.append(k, String(v));
    });
  }
  const qs = search.toString();
  // Usamos la URL absoluta para que el navegador maneje la descarga,
  // enviando el token como query param (alternativa simple al header).
  // El backend acepta el token en Authorization; para descarga,
  // adjuntamos el token en una cabecera no estándar vía fetch + blob si se requiere.
  return `/api${path}${qs ? `?${qs}` : ''}`;
}

export async function downloadFile(path: string, filename: string, params?: Record<string, string>) {
  const res = await api.get(path, {
    params,
    responseType: 'blob',
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
