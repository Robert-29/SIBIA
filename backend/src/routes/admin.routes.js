import { Router } from 'express';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  obtenerAuditLogs,
  ejecutarSeeding
} from '../controllers/admin.controller.js';
import { verificarToken } from '../middleware/auth.middleware.js';
import { verificarRol } from '../middleware/roles.middleware.js';

const router = Router();

router.use(verificarToken);

router.get('/usuarios', verificarRol(['administrador']), obtenerUsuarios);
router.post('/usuarios', verificarRol(['administrador']), crearUsuario);
router.put('/usuarios/:id', verificarRol(['administrador']), actualizarUsuario);
router.get('/logs', verificarRol(['administrador']), obtenerAuditLogs);
router.post('/seed', verificarRol(['administrador']), ejecutarSeeding);

export default router;
