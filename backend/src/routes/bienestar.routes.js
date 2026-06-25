import { Router } from 'express';
import {
  registrarFormularioBienestar,
  obtenerFormularios,
  obtenerFormulariosPorAlumno
} from '../controllers/bienestar.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/formularios', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo']), obtenerFormularios);
router.post('/formularios', verificarRol(['administrador', 'tutor', 'psicologo', 'alumno']), registrarFormularioBienestar);
router.get('/formularios/:alumnoId', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'alumno']), obtenerFormulariosPorAlumno);

export default router;
