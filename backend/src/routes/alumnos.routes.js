import { Router } from 'express';
import {
  obtenerAlumnos,
  obtenerAlumnoPorId,
  obtenerCalificacionesAlumno,
  obtenerAsistenciasAlumno,
  obtenerBienestarAlumno,
  obtenerSeguimientosAlumno,
  crearSeguimientoAlumno,
  obtenerRiesgoAlumno
} from '../controllers/alumnos.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

// Todos los endpoints de alumnos requieren autenticación
router.use(verificarToken);

router.get('/', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor', 'alumno']), obtenerAlumnos);
router.get('/:id', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor', 'alumno']), obtenerAlumnoPorId);
router.get('/:id/riesgo', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor', 'alumno']), obtenerRiesgoAlumno);
router.get('/:id/calificaciones', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'profesor', 'alumno']), obtenerCalificacionesAlumno);
router.get('/:id/asistencias', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'profesor', 'alumno']), obtenerAsistenciasAlumno);
router.get('/:id/bienestar', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'alumno']), obtenerBienestarAlumno);
router.get('/:id/seguimientos', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'alumno']), obtenerSeguimientosAlumno);
router.post('/:id/seguimientos', verificarRol(['administrador', 'jefe_carrera', 'tutor', 'psicologo']), crearSeguimientoAlumno);

export default router;
