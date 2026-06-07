import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});
type FormData = z.infer<typeof schema>;

export function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await loginAdmin(data.email, data.password);
      toast.success('Bienvenido');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(getApiError(err).message || 'Error de autenticación');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6 col-lg-5">
        <div className="card page-card p-4 p-md-5">
          <div className="text-center mb-4">
            <img src="/logo-cpu-unamba.jpeg" alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
            <h4 className="mt-3 mb-1">Iniciar sesión - Administrador</h4>
            <p className="text-secondary mb-0">Centro Preuniversitario UNAMBA</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="admin@test.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="text-center mt-3 small text-secondary">
              <Link to="/docente/login">Acceder como docente</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
