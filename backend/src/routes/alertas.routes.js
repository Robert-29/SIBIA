import { Router } from 'express';
import {
  obtenerAlertas,
  atenderAlerta,
  cerrarAlerta
} from '../controllers/alertas.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/', verificarRol(['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'alumno']), obtenerAlertas);
router.put('/:id/atender', verificarRol(['administrador', 'jefe_carrera', 'tutor', 'psicologo']), atenderAlerta);
router.put('/:id/cerrar', verificarRol(['administrador', 'jefe_carrera', 'tutor', 'psicologo']), cerrarAlerta);

export default router;
