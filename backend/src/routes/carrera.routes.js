import { Router } from 'express';
import {
  obtenerInfoCarrera,
  obtenerCarreraKPIs,
  obtenerAlumnosRiesgo,
  obtenerRiesgoPorSemestreCarrera,
  obtenerProfesoresCarrera,
  obtenerMateriasCriticasCarrera,
  obtenerAlertasCarrera,
  obtenerTutoresCarrera,
  obtenerTendenciaCarrera,
  obtenerGeneraciones,
} from '../controllers/carrera.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

const rolesCarrera = ['administrador', 'director', 'jefe_carrera', 'coordinador'];

router.get('/info',                verificarRol(rolesCarrera), obtenerInfoCarrera);
router.get('/kpis',                verificarRol(rolesCarrera), obtenerCarreraKPIs);
router.get('/alumnos-riesgo',      verificarRol(rolesCarrera), obtenerAlumnosRiesgo);
router.get('/riesgo-por-semestre', verificarRol(rolesCarrera), obtenerRiesgoPorSemestreCarrera);
router.get('/profesores',          verificarRol(rolesCarrera), obtenerProfesoresCarrera);
router.get('/materias-criticas',   verificarRol(rolesCarrera), obtenerMateriasCriticasCarrera);
router.get('/alertas',             verificarRol(rolesCarrera), obtenerAlertasCarrera);
router.get('/tutores',             verificarRol(rolesCarrera), obtenerTutoresCarrera);
router.get('/tendencia',           verificarRol(rolesCarrera), obtenerTendenciaCarrera);
router.get('/generaciones',        verificarRol(['administrador', 'director', ...rolesCarrera]), obtenerGeneraciones);

export default router;
