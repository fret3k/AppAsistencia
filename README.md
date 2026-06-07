# Control de Asistencia - Migración a React + TypeScript

Migración completa del sistema PHP-MVC **Control de Asistencia del Centro Preuniversitario UNAMBA** a un stack moderno:

- **Frontend:** Vite + React 18 + TypeScript + React Router + Bootstrap 5 + React Hook Form + Zod + Axios.
- **Backend:** Node.js + Express + TypeScript + Prisma + MySQL + JWT + ExcelJS.
- **Diseño:** se conservó la paleta, los layouts y la experiencia del sistema original (hero, navbar público, sidebar admin y docente).

## Estructura del monorepo

```
formularioAsistencia-react/
├── backend/   # API REST (Node + Express + Prisma)
└── frontend/  # SPA (Vite + React + TS)
```

## Funcionalidades migradas

| Original (PHP) | React + TS |
| --- | --- |
| Login admin / docente (sesión PHP) | Login admin / docente con JWT |
| CRUD Docentes (validaciones DNI 8d, tel 9d, correo único) | CRUD Docentes con RHF + Zod |
| Registro y listado de Clases Dictadas (cruces y duplicados) | Idem con auto-cálculo de horas |
| Justificaciones con subida de archivos (PDF/Word/img, 8MB) | Idem con FormData + multer |
| Reporte de horas por docente + Excel | Reporte + Excel con ExcelJS |
| Detalle individual del docente | Detalle con filtro por mes + Excel |
| Panel Admin: dashboard, top docentes, últimas clases | Idéntico con cards + estadísticas |
| Configuración de horario laborable (13:00 - 23:59) | Idem editable desde dashboard |
| Notificaciones con campana | Idem con dropdown + lectura en vivo |
| Panel Docente: dashboard, mis clases, perfil | Idem |
| Reportes de exportación a Excel (clases, horas, detalle) | Idem con `.xlsx` (ExcelJS) |
| Restricción por rol (admin / docente) | Middleware `requireAdmin` / `requireDocente` |

## Requisitos

- Node.js 18+ y npm
- MySQL o MariaDB (XAMPP sirve)
- Git (opcional)

## 1. Base de datos

1. Asegúrate de que MySQL/MariaDB esté corriendo (XAMPP, por ejemplo).
2. Crea una base de datos llamada `control_asistencia` (el backend usa `prisma db push` que también puede crearla si tu usuario tiene permisos).
3. Configura `backend/.env` copiando `backend/.env.example`:

```
DATABASE_URL="mysql://root:1234@127.0.0.1:3306/control_asistencia"
JWT_SECRET="cambia-esto-en-produccion"
```

## 2. Backend

```powershell
cd backend
npm install
npx prisma db push        # crea/actualiza las tablas
npm run seed              # crea el admin por defecto
npm run dev               # http://localhost:4000
```

Admin por defecto: `admin@test.com` / `admin123`.

### Endpoints principales

- `POST /api/auth/admin/login`
- `POST /api/auth/docente/login`
- `GET  /api/docentes` (público para registrar, protegido para listar)
- `POST /api/docentes` (público)
- `PUT/DELETE /api/docentes/:id` (admin)
- `GET/POST /api/clases`
- `PUT/DELETE /api/clases/:id`
- `GET/POST /api/justificaciones` (con upload `archivo`)
- `GET /api/justificaciones/:id/archivo`
- `GET /api/admin/dashboard` (admin)
- `GET /api/admin/reportes/horas-docentes` (admin)
- `GET /api/admin/docentes/:id` (admin)
- `GET /api/admin/settings` · `POST /api/admin/settings/toggle-working-hours` · `POST /api/admin/settings/update-working-hours`
- `GET /api/notificaciones` · `POST /api/notificaciones/:id/leer` · `POST /api/notificaciones/leer-todas`
- `GET /api/exports/clases` · `GET /api/exports/teacher-hours` · `GET /api/exports/teacher-detail/:id` · `GET /api/exports/justificaciones` (todos admin, devuelven `.xlsx`)

## 3. Frontend

```powershell
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Vite hace proxy de `/api` y `/uploads` al backend (`localhost:4000`).

## 4. Producción

```powershell
# backend
cd backend
npm run build && npm start

# frontend
cd ../frontend
npm run build
```

Los assets del frontend quedan en `frontend/dist` y pueden servirse con cualquier servidor estático (Nginx, Apache, InfinityFree, etc.).

## 5. Notas importantes

- **Contraseñas:** el PHP original guardaba contraseñas en texto plano. Esta migración usa **bcrypt** con hash, por lo que las contraseñas existentes no son compatibles. Ejecuta el seed para crear el admin y vuelve a registrar los docentes (o ajusta la migración según necesites).
- **DNI docente:** el inicio de sesión del docente mantiene la convención del PHP: si es la primera vez, el password se inicializa con el DNI hasheado.
- **Horario laborable:** configurable desde el dashboard admin (por defecto 13:00 - 23:59, activado).
- **Notificaciones:** se crean automáticamente al registrar justificaciones; el admin puede marcarlas como leídas individualmente o todas a la vez.
- **Archivos:** se guardan en `backend/uploads/justificaciones/` y se sirven en `/uploads/...`.
- **Logo:** copia `app/icono/images.jpeg` del proyecto PHP a `frontend/public/logo-cpu-unamba.jpeg`.

## 6. Próximos pasos sugeridos

- Tests automatizados (Vitest, Jest o Playwright).
- Despliegue continuo (GitHub Actions + VPS / Vercel + Railway).
- Reemplazar almacenamiento local por S3 / Cloudinary si necesitas escalar.
- PWA para uso móvil offline.
