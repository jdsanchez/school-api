import express from 'express';
import db from '../config/database.js';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// GET /api/banners - Obtener todos los banners (público)
router.get('/', async (req, res) => {
  try {
    const [banners] = await db.query(
      'SELECT * FROM banners WHERE activo = 1 ORDER BY orden ASC'
    );
    res.json(banners);
  } catch (error) {
    console.error('Error al obtener banners:', error);
    res.status(500).json({ message: 'Error al obtener banners' });
  }
});

// GET /api/banners/admin - Obtener todos los banners para admin
router.get('/admin', verifyToken, verifyRole('Admin', 'Director'), async (req, res) => {
  try {
    const [banners] = await db.query(
      'SELECT * FROM banners ORDER BY orden ASC, id DESC'
    );
    res.json(banners);
  } catch (error) {
    console.error('Error al obtener banners:', error);
    res.status(500).json({ message: 'Error al obtener banners' });
  }
});

// GET /api/banners/:id - Obtener un banner por ID
router.get('/:id', verifyToken, verifyRole('Admin', 'Director'), async (req, res) => {
  try {
    const [banners] = await db.query(
      'SELECT * FROM banners WHERE id = ?',
      [req.params.id]
    );
    
    if (banners.length === 0) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    res.json(banners[0]);
  } catch (error) {
    console.error('Error al obtener banner:', error);
    res.status(500).json({ message: 'Error al obtener banner' });
  }
});

// POST /api/banners - Crear un nuevo banner
router.post('/', verifyToken, verifyRole('Admin', 'Director'), upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, descripcion, orden, activo } = req.body;
    
    if (!titulo) {
      return res.status(400).json({ message: 'El título es requerido' });
    }
    
    let imagenPath = req.body.imagen_url || ''; // URL externa
    
    // Si se subió un archivo
    if (req.file) {
      imagenPath = '/uploads/banners/' + req.file.filename;
    }
    
    if (!imagenPath) {
      return res.status(400).json({ message: 'La imagen es requerida' });
    }
    
    const [result] = await db.query(
      'INSERT INTO banners (titulo, descripcion, imagen, orden, activo) VALUES (?, ?, ?, ?, ?)',
      [titulo, descripcion || null, imagenPath, orden || 0, activo !== undefined ? activo : 1]
    );
    
    res.status(201).json({
      message: 'Banner creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear banner:', error);
    res.status(500).json({ message: 'Error al crear banner' });
  }
});

// PUT /api/banners/:id - Actualizar un banner
router.put('/:id', verifyToken, verifyRole('Admin', 'Director'), upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, descripcion, orden, activo, imagen_url } = req.body;
    const bannerId = req.params.id;
    
    // Verificar que el banner existe
    const [existingBanner] = await db.query('SELECT * FROM banners WHERE id = ?', [bannerId]);
    if (existingBanner.length === 0) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    let imagenPath = existingBanner[0].imagen;
    
    // Si se subió una nueva imagen
    if (req.file) {
      imagenPath = '/uploads/banners/' + req.file.filename;
      
      // Eliminar imagen anterior si existe y es local
      const oldImage = existingBanner[0].imagen;
      if (oldImage && oldImage.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', oldImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    } else if (imagen_url) {
      // Si se proporcionó una URL externa
      imagenPath = imagen_url;
    }
    
    await db.query(
      'UPDATE banners SET titulo = ?, descripcion = ?, imagen = ?, orden = ?, activo = ? WHERE id = ?',
      [titulo, descripcion || null, imagenPath, orden || 0, activo !== undefined ? activo : 1, bannerId]
    );
    
    res.json({ message: 'Banner actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar banner:', error);
    res.status(500).json({ message: 'Error al actualizar banner' });
  }
});

// DELETE /api/banners/:id - Eliminar un banner
router.delete('/:id', verifyToken, verifyRole('Admin', 'Director'), async (req, res) => {
  try {
    const bannerId = req.params.id;
    
    // Obtener info del banner para eliminar imagen
    const [banner] = await db.query('SELECT imagen FROM banners WHERE id = ?', [bannerId]);
    
    if (banner.length === 0) {
      return res.status(404).json({ message: 'Banner no encontrado' });
    }
    
    // Eliminar imagen si es local
    const imagenPath = banner[0].imagen;
    if (imagenPath && imagenPath.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, '..', imagenPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    
    await db.query('DELETE FROM banners WHERE id = ?', [bannerId]);
    
    res.json({ message: 'Banner eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar banner:', error);
    res.status(500).json({ message: 'Error al eliminar banner' });
  }
});

// PUT /api/banners/:id/toggle - Activar/Desactivar banner
router.put('/:id/toggle', verifyToken, verifyRole('Admin', 'Director'), async (req, res) => {
  try {
    const bannerId = req.params.id;
    
    await db.query(
      'UPDATE banners SET activo = NOT activo WHERE id = ?',
      [bannerId]
    );
    
    res.json({ message: 'Estado del banner actualizado' });
  } catch (error) {
    console.error('Error al cambiar estado del banner:', error);
    res.status(500).json({ message: 'Error al cambiar estado del banner' });
  }
});

export default router;
