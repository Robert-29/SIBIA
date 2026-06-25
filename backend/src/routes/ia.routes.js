import { Router } from 'express';
import {
  analizarAlumno,
  analizarGrupo,
  analizarCarrera,
  obtenerResumenEjecutivoIA,
  ejecutarChat
} from '../controllers/ia.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.post('/analizar/:id', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo']), analizarAlumno);
router.post('/analizar-grupo/:grupoId', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'profesor']), analizarGrupo);
router.post('/tendencia-carrera/:carreraId', verificarRol(['administrador', 'director', 'jefe_carrera']), analizarCarrera);
router.post('/resumen-ejecutivo', verificarRol(['administrador', 'director']), obtenerResumenEjecutivoIA);
router.post('/chat', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo']), ejecutarChat);

export default router;
