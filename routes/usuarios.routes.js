import express from 'express';
import { 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario,
  resetearPassword,
  cambiarPassword,
  cambiarMiPassword
} from '../controllers/usuarios.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/usuarios - Obtener todos los usuarios
router.get('/', obtenerUsuarios);

// GET /api/usuarios/:id - Obtener un usuario por ID
router.get('/:id', obtenerUsuarioPorId);

// POST /api/usuarios - Crear un nuevo usuario
router.post('/', verifyRole('Admin', 'Director'), crearUsuario);

// PUT /api/usuarios/:id - Actualizar un usuario
router.put('/:id', verifyRole('Admin', 'Director'), actualizarUsuario);

// DELETE /api/usuarios/:id - Eliminar un usuario
router.delete('/:id', verifyRole('Admin', 'Director'), eliminarUsuario);

// PUT /api/usuarios/:id/cambiar-password - Cambiar contraseña de usuario
router.put('/:id/cambiar-password', verifyRole('Admin', 'Director'), cambiarPassword);

// PUT /api/usuarios/:id/cambiar-mi-password - Cambiar mi propia contraseña
router.put('/:id/cambiar-mi-password', cambiarMiPassword);

// POST /api/usuarios/:id/resetear-password - Resetear contraseña
router.post('/:id/resetear-password', verifyRole('Admin', 'Director'), resetearPassword);

export default router;
