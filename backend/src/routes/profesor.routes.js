import { Router } from 'express';
import {
  obtenerResumenProfesor,
  obtenerGruposProfesor,
  obtenerRadiografiaGrupo,
  obtenerAlumnosRiesgoGrupo,
  obtenerAsistenciaGrupo,
  obtenerComparativaGrupos,
  registrarAsistenciaGrupo,
  obtenerAlumnosGrupo,
  registrarCalificacionesGrupo,
  obtenerDetalleAlumnoProfesor,
} from '../controllers/profesor.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

const rolesProfesor = ['profesor', 'administrador'];

router.get('/resumen',                        verificarRol(rolesProfesor), obtenerResumenProfesor);
router.get('/grupos',                         verificarRol(rolesProfesor), obtenerGruposProfesor);
router.get('/comparativa',                    verificarRol(rolesProfesor), obtenerComparativaGrupos);
router.get('/grupo/:id/radiografia',          verificarRol(rolesProfesor), obtenerRadiografiaGrupo);
router.get('/grupo/:id/alumnos-riesgo',       verificarRol(rolesProfesor), obtenerAlumnosRiesgoGrupo);
router.get('/grupo/:id/asistencia',           verificarRol(rolesProfesor), obtenerAsistenciaGrupo);
router.get('/grupo/:id/alumnos',              verificarRol(rolesProfesor), obtenerAlumnosGrupo);
router.post('/grupo/:id/asistencia',          verificarRol(rolesProfesor), registrarAsistenciaGrupo);
router.post('/grupo/:id/calificaciones',      verificarRol(rolesProfesor), registrarCalificacionesGrupo);
router.get('/alumno/:id/detalle',             verificarRol(rolesProfesor), obtenerDetalleAlumnoProfesor);

export default router;
