import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  obtenerTareasPorCurso,
  obtenerTarea,
  crearTarea,
  actualizarTarea,
  eliminarTarea,
  entregarTarea,
  obtenerEntregas,
  calificarEntrega,
  rechazarEntrega,
  obtenerMisTareas
} from '../controllers/tareas.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para tareas
const storageTareas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/tareas'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tarea-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configurar multer para entregas
const storageEntregas = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/entregas'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'entrega-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadTarea = multer({
  storage: storageTareas,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de archivo no permitido'));
  }
});

const uploadEntrega = multer({
  storage: storageEntregas,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Tipo de archivo no permitido'));
  }
});

// Rutas (todas requieren autenticación)
router.use(verifyToken);

router.get('/mis-tareas', obtenerMisTareas); // Para alumnos
router.get('/curso/:curso_id', obtenerTareasPorCurso);
router.get('/:id', obtenerTarea);
router.post('/', uploadTarea.single('archivo_adjunto'), crearTarea);
router.put('/:id', uploadTarea.single('archivo_adjunto'), actualizarTarea);
router.delete('/:id', eliminarTarea);

// Entregas
router.post('/:tarea_id/entregar', uploadEntrega.single('archivo_entrega'), entregarTarea);
router.get('/:tarea_id/entregas', obtenerEntregas);
router.put('/entregas/:id/calificar', calificarEntrega);
router.put('/entregas/:id/rechazar', rechazarEntrega);

export default router;
