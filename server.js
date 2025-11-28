import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import menusRoutes from './routes/menus.routes.js';
import permisosRoutes from './routes/permisos.routes.js';
import materiasRoutes from './routes/materias.routes.js';
import cursosRoutes from './routes/cursos.routes.js';
import pagosRoutes from './routes/pagos.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';
import calificacionesRoutes from './routes/calificaciones.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';
import tareasRoutes from './routes/tareas.routes.js';
import bannersRoutes from './routes/banners.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/calificaciones', calificacionesRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/banners', bannersRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '🎓 API del Sistema de Gestión Escolar',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      roles: '/api/roles',
      usuarios: '/api/usuarios',
      menus: '/api/menus',
      permisos: '/api/permisos',
      materias: '/api/materias',
      cursos: '/api/cursos',
      pagos: '/api/pagos',
      asistencia: '/api/asistencia',
      calificaciones: '/api/calificaciones',
      configuracion: '/api/configuracion'
    }
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores general
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
