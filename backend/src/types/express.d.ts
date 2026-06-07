export interface AuthUser {
  id: number;
  email: string;
  isAdmin: boolean;
  role: 'admin' | 'docente';
  docenteId?: number | null;
  docenteNombres?: string | null;
  docenteApellidos?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
