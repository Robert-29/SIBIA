import { Router } from 'express';
import {
  obtenerResumenTutor,
  obtenerKPIsTutor,
  obtenerAlertasUrgentesTutor,
  obtenerAlumnosTutor,
  obtenerDetalleAlumnoTutor,
  registrarSeguimientoTutor,
  obtenerEstadisticasTutor
} from '../controllers/tutor.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

const rolesTutor = ['administrador', 'tutor'];

router.get('/resumen',           verificarRol(rolesTutor), obtenerResumenTutor);
router.get('/kpis',              verificarRol(rolesTutor), obtenerKPIsTutor);
router.get('/alertas-urgentes',  verificarRol(rolesTutor), obtenerAlertasUrgentesTutor);
router.get('/alumnos',           verificarRol(rolesTutor), obtenerAlumnosTutor);
router.get('/alumno/:id',        verificarRol(rolesTutor), obtenerDetalleAlumnoTutor);
router.post('/seguimiento',      verificarRol(rolesTutor), registrarSeguimientoTutor);
router.get('/estadisticas',      verificarRol(rolesTutor), obtenerEstadisticasTutor);

export default router;
