import { Router } from 'express';
import {
  obtenerUniversidadKPIs,
  obtenerCarreraKPIs,
  obtenerDistribucionRiesgo,
  obtenerComparativaCarreras
} from '../controllers/reportes.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/universidad', verificarRol(['administrador', 'director']), obtenerUniversidadKPIs);
router.get('/carrera/:id', verificarRol(['administrador', 'director', 'jefe_carrera']), obtenerCarreraKPIs);
router.get('/riesgo-distribucion', verificarRol(['administrador', 'director', 'jefe_carrera']), obtenerDistribucionRiesgo);
router.get('/comparativa-carreras', verificarRol(['administrador', 'director']), obtenerComparativaCarreras);

export default router;
