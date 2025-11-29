import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  obtenerPagos,
  obtenerHistorialAlumno,
  registrarPago,
  actualizarPago,
  confirmarPago,
  rechazarPago,
  obtenerNotificaciones,
  marcarNotificacionLeida,
  verificarPagosAtrasados,
  obtenerEstadisticas,
  obtenerMisPagos,
  obtenerNotificacionesCompletas
} from '../controllers/pagos.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Crear directorio para comprobantes si no existe
const uploadDir = path.join(__dirname, '../uploads/comprobantes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para subir comprobantes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'comprobante-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes y PDFs
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPG, PNG y PDF'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Rutas
router.get('/', verifyToken, obtenerPagos);
router.get('/estadisticas', verifyToken, obtenerEstadisticas);
router.get('/mis-pagos', verifyToken, obtenerMisPagos);
router.get('/alumno/:alumno_id', verifyToken, obtenerHistorialAlumno);
router.get('/notificaciones/:alumno_id', verifyToken, obtenerNotificaciones);
router.get('/notificaciones-completas/:alumno_id', verifyToken, obtenerNotificacionesCompletas);
router.post('/', verifyToken, upload.single('comprobante'), registrarPago);
router.put('/:id', verifyToken, upload.single('comprobante'), actualizarPago);
router.put('/:id/confirmar', verifyToken, confirmarPago);
router.put('/:id/rechazar', verifyToken, rechazarPago);
router.put('/notificaciones/:id/leer', verifyToken, marcarNotificacionLeida);
router.post('/verificar-atrasados', verifyToken, verificarPagosAtrasados);

export default router;
