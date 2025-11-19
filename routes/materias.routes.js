import express from 'express';
import { 
  obtenerMaterias, 
  obtenerMateriaPorId, 
  crearMateria, 
  actualizarMateria, 
  eliminarMateria 
} from '../controllers/materias.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', obtenerMaterias);
router.get('/:id', obtenerMateriaPorId);
router.post('/', verifyRole('Admin', 'Director'), crearMateria);
router.put('/:id', verifyRole('Admin', 'Director'), actualizarMateria);
router.delete('/:id', verifyRole('Admin', 'Director'), eliminarMateria);

export default router;
