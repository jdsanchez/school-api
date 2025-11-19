import express from 'express';
import { 
  obtenerRoles, 
  obtenerRolPorId, 
  crearRol, 
  actualizarRol, 
  eliminarRol 
} from '../controllers/roles.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/roles - Obtener todos los roles
router.get('/', obtenerRoles);

// GET /api/roles/:id - Obtener un rol por ID
router.get('/:id', obtenerRolPorId);

// POST /api/roles - Crear un nuevo rol (Solo Admin)
router.post('/', verifyRole('Admin'), crearRol);

// PUT /api/roles/:id - Actualizar un rol (Solo Admin)
router.put('/:id', verifyRole('Admin'), actualizarRol);

// DELETE /api/roles/:id - Eliminar un rol (Solo Admin)
router.delete('/:id', verifyRole('Admin'), eliminarRol);

export default router;
