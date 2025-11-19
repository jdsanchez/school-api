import db from '../config/database.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

export const obtenerConfiguracion = async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM configuracion ORDER BY id DESC LIMIT 1');
    
    if (config.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    res.json(config[0]);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const { nombre_sistema, email_contacto, telefono_contacto, direccion, tema_color } = req.body;
    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    const [config] = await db.query('SELECT * FROM configuracion ORDER BY id DESC LIMIT 1');
    
    if (config.length === 0) {
      // Crear configuración
      await db.query(
        `INSERT INTO configuracion (nombre_sistema, logo, email_contacto, telefono_contacto, direccion, tema_color)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [nombre_sistema, logo, email_contacto, telefono_contacto, direccion, tema_color]
      );
    } else {
      // Actualizar configuración
      const updateFields = [];
      const params = [];
      
      if (nombre_sistema) {
        updateFields.push('nombre_sistema = ?');
        params.push(nombre_sistema);
      }
      if (logo) {
        updateFields.push('logo = ?');
        params.push(logo);
      }
      if (email_contacto) {
        updateFields.push('email_contacto = ?');
        params.push(email_contacto);
      }
      if (telefono_contacto) {
        updateFields.push('telefono_contacto = ?');
        params.push(telefono_contacto);
      }
      if (direccion) {
        updateFields.push('direccion = ?');
        params.push(direccion);
      }
      if (tema_color) {
        updateFields.push('tema_color = ?');
        params.push(tema_color);
      }
      
      params.push(config[0].id);
      
      if (updateFields.length > 0) {
        await db.query(
          `UPDATE configuracion SET ${updateFields.join(', ')} WHERE id = ?`,
          params
        );
      }
    }

    res.json({ mensaje: 'Configuración actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};
