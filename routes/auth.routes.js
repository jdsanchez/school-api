import express from 'express';
import { login, verificarAuth, cambiarPassword, recuperarPassword, restablecerPassword } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// POST /api/auth/login - Login
router.post('/login', login);

// GET /api/auth/verificar - Verificar token y obtener usuario
router.get('/verificar', verifyToken, verificarAuth);

// POST /api/auth/cambiar-password - Cambiar contraseña
router.post('/cambiar-password', verifyToken, cambiarPassword);

// POST /api/auth/recuperar-password - Solicitar recuperación de contraseña
router.post('/recuperar-password', recuperarPassword);

// POST /api/auth/restablecer-password - Restablecer contraseña con token
router.post('/restablecer-password', restablecerPassword);

export default router;
