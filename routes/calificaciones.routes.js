import express from 'express';
import { obtenerCalificaciones, registrarCalificacion, actualizarCalificacion } from '../controllers/calificaciones.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', obtenerCalificaciones);
router.post('/', verifyRole('Admin', 'Director', 'Maestro'), registrarCalificacion);
router.put('/:id', verifyRole('Admin', 'Director', 'Maestro'), actualizarCalificacion);

export default router;
