import express from 'express';
import { 
  obtenerMenus,
  obtenerSubmenus,
  obtenerMenusPorRol, 
  crearMenu, 
  crearSubmenu,
  actualizarMenu,
  eliminarMenu,
  actualizarSubmenu,
  eliminarSubmenu
} from '../controllers/menus.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// GET /api/menus - Obtener todos los menús con contador de submenús
router.get('/', obtenerMenus);

// GET /api/menus/submenus - Obtener todos los submenús con nombre del menú
router.get('/submenus', obtenerSubmenus);

// GET /api/menus/rol/:rolId - Obtener menús por rol
router.get('/rol/:rolId', obtenerMenusPorRol);

// POST /api/menus - Crear un menú
router.post('/', verifyRole('Admin'), crearMenu);

// PUT /api/menus/:id - Actualizar un menú
router.put('/:id', verifyRole('Admin'), actualizarMenu);

// DELETE /api/menus/:id - Eliminar un menú
router.delete('/:id', verifyRole('Admin'), eliminarMenu);

// POST /api/menus/submenu - Crear un submenú
router.post('/submenu', verifyRole('Admin'), crearSubmenu);

// PUT /api/menus/submenu/:id - Actualizar un submenú
router.put('/submenu/:id', verifyRole('Admin'), actualizarSubmenu);

// DELETE /api/menus/submenu/:id - Eliminar un submenú
router.delete('/submenu/:id', verifyRole('Admin'), eliminarSubmenu);

export default router;
