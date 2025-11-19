import express from 'express';
import { obtenerConfiguracion, actualizarConfiguracion, upload } from '../controllers/configuracion.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Ruta pública para obtener configuración
router.get('/', obtenerConfiguracion);

// Rutas protegidas
router.put('/', verifyToken, verifyRole('Admin'), upload.single('logo'), actualizarConfiguracion);

export default router;
