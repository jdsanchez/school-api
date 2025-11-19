import express from 'express';
import { 
  obtenerPermisosPorRol, 
  obtenerMenusDisponibles,
  obtenerMatrizPermisos,
  asignarPermisos,
  actualizarPermiso
} from '../controllers/permisos.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);
router.use(verifyRole('Admin', 'Director'));

// GET /api/permisos/rol/:rolId - Obtener permisos por rol
router.get('/rol/:rolId', obtenerPermisosPorRol);

// GET /api/permisos/menus - Obtener todos los menús disponibles
router.get('/menus', obtenerMenusDisponibles);

// GET /api/permisos/matriz - Obtener matriz de permisos (todos los roles vs menús)
router.get('/matriz', obtenerMatrizPermisos);

// POST /api/permisos - Asignar permisos masivos a un rol
router.post('/', asignarPermisos);

// PUT /api/permisos/individual - Actualizar un permiso individual
router.put('/individual', actualizarPermiso);

export default router;
