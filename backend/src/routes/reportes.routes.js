import { Router } from 'express';
import {
  obtenerUniversidadKPIs,
  obtenerCarreraKPIs,
  obtenerDistribucionRiesgo,
  obtenerComparativaCarreras,
  obtenerDirectorKPIs,
  obtenerComparativaCarrerasDetalle,
  obtenerRiesgoPorSemestre,
  obtenerMateriasCriticas,
  obtenerProfesoresDesempeno,
  obtenerAlertasDirector,
  obtenerTendenciaHistorica,
  obtenerGeneracionesInstitucional,
} from '../controllers/reportes.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/universidad', verificarRol(['administrador', 'director']), obtenerUniversidadKPIs);
router.get('/carrera/:id', verificarRol(['administrador', 'director', 'jefe_carrera']), obtenerCarreraKPIs);
router.get('/riesgo-distribucion', verificarRol(['administrador', 'director', 'jefe_carrera']), obtenerDistribucionRiesgo);
router.get('/comparativa-carreras', verificarRol(['administrador', 'director']), obtenerComparativaCarreras);
router.get('/director-kpis', verificarRol(['administrador', 'director']), obtenerDirectorKPIs);
router.get('/comparativa-carreras-detalle', verificarRol(['administrador', 'director']), obtenerComparativaCarrerasDetalle);
router.get('/riesgo-por-semestre', verificarRol(['administrador', 'director']), obtenerRiesgoPorSemestre);
router.get('/materias-criticas', verificarRol(['administrador', 'director']), obtenerMateriasCriticas);
router.get('/profesores-desempeno', verificarRol(['administrador', 'director']), obtenerProfesoresDesempeno);
router.get('/alertas-director', verificarRol(['administrador', 'director']), obtenerAlertasDirector);
router.get('/tendencia-historica', verificarRol(['administrador', 'director']), obtenerTendenciaHistorica);
router.get('/generaciones', verificarRol(['administrador', 'director', 'jefe_carrera', 'coordinador']), obtenerGeneracionesInstitucional);

export default router;
