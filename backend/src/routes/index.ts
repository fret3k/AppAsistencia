import { Router } from 'express';
import * as auth from '../controllers/auth.controller';
import * as doc from '../controllers/docente.controller';
import * as clase from '../controllers/clase.controller';
import * as just from '../controllers/justificacion.controller';
import * as notif from '../controllers/notificacion.controller';
import * as admin from '../controllers/admin.controller';
import * as exp from '../controllers/exports.controller';
import * as settings from '../services/settings.service';
import { requireAdmin, requireAuth, requireDocente } from '../middlewares/auth';
import { uploadJustificacion } from '../middlewares/upload';

const router = Router();

// AUTH
router.post('/auth/admin/login', auth.adminLogin);
router.post('/auth/docente/login', auth.docenteLogin);
router.get('/auth/me', requireAuth, auth.me);

// DOCENTES
router.get('/docentes', requireAuth, doc.listDocentes);
router.get('/docentes/search', requireAuth, doc.searchDocentes);
router.get('/docentes/:id', requireAuth, doc.getDocente);
router.post('/docentes', doc.createDocente);
router.put('/docentes/:id', requireAdmin, doc.updateDocente);
router.delete('/docentes/:id', requireAdmin, doc.deleteDocente);

// CLASES
router.get('/clases', requireAuth, clase.listClases);
router.get('/clases/meses', requireAuth, clase.mesesRegistrados);
router.get('/clases/totales-mes', requireAuth, clase.totalesPorMes);
router.get('/clases/total-horas', requireAuth, clase.totalHoras);
router.get('/clases/:id', requireAuth, clase.getClase);
router.post('/clases', clase.createClase);
router.put('/clases/:id', requireAuth, clase.updateClase);
router.delete('/clases/:id', requireAuth, clase.deleteClase);

// DOCENTE (panel)
router.get('/docente/mis-clases', requireAuth, requireDocente, clase.listMisClases);

// JUSTIFICACIONES
router.get('/justificaciones', requireAuth, just.listJustificaciones);
router.get('/justificaciones/:id', requireAuth, just.getJustificacion);
router.post(
  '/justificaciones',
  (req, res, next) => uploadJustificacion(req, res, (err) => {
    if (err) return res.status(422).json({ message: err.message, errors: { archivo: err.message } });
    next();
  }),
  just.createJustificacion
);
router.get('/justificaciones/:id/archivo', just.downloadArchivo);

// NOTIFICACIONES
router.get('/notificaciones', requireAuth, requireAdmin, notif.listNoLeidas);
router.get('/notificaciones/recientes', requireAuth, requireAdmin, notif.listRecientes);
router.post('/notificaciones/leer-todas', requireAuth, requireAdmin, notif.marcarTodasLeidas);
router.post('/notificaciones/:id/leer', requireAuth, requireAdmin, notif.marcarLeida);

// ADMIN DASHBOARD
router.get('/admin/dashboard', requireAuth, requireAdmin, admin.dashboard);
router.get('/admin/reportes/horas-docentes', requireAuth, requireAdmin, admin.teacherHoursReport);
router.get('/admin/docentes/:id', requireAuth, requireAdmin, admin.teacherDetail);
router.get('/admin/docentes/:id/clases', requireAuth, requireAdmin, clase.listClasesDocente);

// SETTINGS
router.get('/admin/settings', requireAuth, requireAdmin, settings.getSettings);
router.post('/admin/settings/toggle-working-hours', requireAuth, requireAdmin, settings.toggleWorkingHours);
router.post('/admin/settings/update-working-hours', requireAuth, requireAdmin, settings.updateWorkingHours);

// EXPORTS (Excel)
router.get('/exports/clases', requireAuth, requireAdmin, exp.exportClases);
router.get('/exports/teacher-hours', requireAuth, requireAdmin, exp.exportTeacherHours);
router.get('/exports/teacher-detail/:id', requireAuth, requireAdmin, exp.exportTeacherDetail);
router.get('/exports/justificaciones', requireAuth, requireAdmin, exp.exportJustificaciones);

export default router;
