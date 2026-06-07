import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: ReactNode;
  require?: 'admin' | 'docente';
}

export function ProtectedRoute({ children, require }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border" role="status" />
      </div>
    );
  }
  if (!user) {
    const target = require === 'docente' ? '/docente/login' : '/login';
    return <Navigate to={target} state={{ from: location }} replace />;
  }
  if (require && user.role !== require) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/docente/dashboard'} replace />;
  }
  return <>{children}</>;
}
