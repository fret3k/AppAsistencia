export interface Docente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  correo?: string | null;
  telefono?: string | null;
  especialidad?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Clase {
  id: number;
  docenteId: number;
  asignatura: string;
  tema?: string | null;
  fecha: string;
  horaInicio: string;
  horaTermino: string;
  aula: string;
  numeroHoras: number;
  firma?: string | null;
  firmaTermino?: string | null;
  observaciones?: string | null;
  docente?: Docente;
}

export interface Justificacion {
  id: number;
  docenteId?: number | null;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  tipo: 'permiso' | 'asistencia';
  motivo: string;
  claseADictar: string;
  aula: string;
  fechaJustificacion: string;
  archivoPath?: string | null;
  archivoNombre?: string | null;
  archivoTipo?: string | null;
  createdAt?: string;
  docente?: Docente | null;
}

export interface Notificacion {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  claseId?: number | null;
  justificacionId?: number | null;
  leida: boolean;
  createdAt: string;
  clase?: Clase | null;
  justificacion?: Justificacion | null;
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'admin' | 'docente';
  isAdmin: boolean;
  docenteId?: number | null;
  docenteNombres?: string | null;
  docenteApellidos?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface DashboardData {
  totalDocentes: number;
  totalClases: number;
  totalHoras: number;
  horasMesActual: number;
  mesActual: string;
  topDocentes: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    especialidad?: string | null;
    totalHoras: number;
    totalClases: number;
  }>;
  ultimasClases: Clase[];
  notifsCount: number;
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
}

export interface TeacherHoursReport {
  docentes: Array<{
    id: number;
    nombres: string;
    apellidos: string;
    horas: Record<string, number>;
    total: number;
  }>;
  meses: string[];
  search: string;
}
