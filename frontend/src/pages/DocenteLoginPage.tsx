import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getApiError } from '@/lib/api';

const schema = z.object({
  dni: z.string().trim().regex(/^[0-9]{8,15}$/, 'DNI inválido (8 a 15 dígitos).'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});
type FormData = z.infer<typeof schema>;

export function DocenteLoginPage() {
  const { loginDocente } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await loginDocente(data.dni, data.password);
      toast.success('Bienvenido');
      navigate('/docente/dashboard');
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
            <h4 className="mt-3 mb-1">Acceso Docente</h4>
            <p className="text-secondary mb-0">Centro Preuniversitario UNAMBA</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label">DNI</label>
              <input
                type="text"
                inputMode="numeric"
                className={`form-control ${errors.dni ? 'is-invalid' : ''}`}
                placeholder="12345678"
                {...register('dni')}
              />
              {errors.dni && <div className="invalid-feedback">{errors.dni.message}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              <div className="form-text">Si es tu primer acceso, usa tu DNI como contraseña.</div>
            </div>
            <button type="submit" className="btn btn-info w-100 py-2" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
            <div className="text-center mt-3 small text-secondary">
              <Link to="/login">Acceder como administrador</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
