import { Router } from 'express';
import { loginUsuario, logoutUsuario } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', loginUsuario);
router.post('/logout', logoutUsuario);

export default router;
