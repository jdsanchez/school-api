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
  obtenerMisAsignaciones
} from '../controllers/cursos.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(verifyToken);

// Rutas de cursos
router.get('/', obtenerCursos);
router.get('/maestros', obtenerMaestros);
router.get('/mis-asignaciones', obtenerMisAsignaciones);
router.get('/:id/alumnos', obtenerAlumnosPorCurso);
router.get('/:id', obtenerCursoPorId);
router.post('/', crearCurso);
router.put('/:id', actualizarCurso);
router.delete('/:id', eliminarCurso);

// Rutas de inscripciones
router.post('/inscribir', inscribirAlumno);
router.put('/inscripcion/:id', actualizarInscripcion);

export default router;
