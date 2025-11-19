import express from 'express';
import { 
  obtenerUsuarios, 
  obtenerUsuarioPorId, 
  crearUsuario, 
  actualizarUsuario, 
  eliminarUsuario,
  resetearPassword
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

// POST /api/usuarios/:id/resetear-password - Resetear contraseña
router.post('/:id/resetear-password', verifyRole('Admin', 'Director'), resetearPassword);

export default router;
