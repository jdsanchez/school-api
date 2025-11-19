import express from 'express';
import { 
  obtenerMenus, 
  obtenerMenusPorRol, 
  crearMenu, 
  crearSubmenu 
} from '../controllers/menus.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// GET /api/menus - Obtener todos los menús
router.get('/', obtenerMenus);

// GET /api/menus/rol/:rolId - Obtener menús por rol
router.get('/rol/:rolId', obtenerMenusPorRol);

// POST /api/menus - Crear un menú
router.post('/', verifyRole('Admin'), crearMenu);

// POST /api/menus/submenu - Crear un submenú
router.post('/submenu', verifyRole('Admin'), crearSubmenu);

export default router;
