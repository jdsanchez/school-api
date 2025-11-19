import express from 'express';
import { obtenerAsistencias, registrarAsistencia } from '../controllers/asistencia.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', obtenerAsistencias);
router.post('/', verifyRole('Admin', 'Director', 'Maestro'), registrarAsistencia);

export default router;
