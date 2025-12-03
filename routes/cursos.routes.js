import express from 'express';
import {
  obtenerCursos,
  obtenerCursoPorId,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
  inscribirAlumno,
  actualizarInscripcion,
  obtenerMaestros,
  obtenerAlumnosPorCurso,
  obtenerMisAsignaciones,
  obtenerAlumnosDisponibles
} from '../controllers/cursos.controller.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// Rutas de cursos
router.get('/', obtenerCursos);
router.get('/maestros', obtenerMaestros);
router.get('/mis-asignaciones', obtenerMisAsignaciones);
router.get('/:id/alumnos', obtenerAlumnosPorCurso);
router.get('/:id/alumnos-disponibles', verifyRole('Admin', 'Director', 'Maestro'), obtenerAlumnosDisponibles);
router.get('/:id', obtenerCursoPorId);
router.post('/', crearCurso);
router.put('/:id', actualizarCurso);
router.delete('/:id', eliminarCurso);

// Rutas de inscripciones (solo Admin, Director, Maestro pueden inscribir alumnos)
router.post('/inscribir', verifyRole('Admin', 'Director', 'Maestro'), inscribirAlumno);
router.put('/inscripcion/:id', verifyRole('Admin', 'Director', 'Maestro'), actualizarInscripcion);

export default router;
