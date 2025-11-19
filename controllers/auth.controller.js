import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

// Login - Soporta email, código de alumno o DPI
export const login = async (req, res) => {
  try {
    const { identificador, password } = req.body;

    if (!identificador || !password) {
      return res.status(400).json({ error: 'Identificador y contraseña son requeridos' });
    }

    // Buscar usuario por email, código de alumno o DPI
    const [usuarios] = await db.query(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u 
       INNER JOIN roles r ON u.rol_id = r.id 
       WHERE (u.email = ? OR u.codigo_alumno = ? OR u.dpi = ?) AND u.activo = TRUE`,
      [identificador, identificador, identificador]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        rol: usuario.rol_nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Ocultar password
    delete usuario.password;

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Verificar token y obtener usuario actual
export const verificarAuth = async (req, res) => {
  try {
    const usuario = req.usuario;
    delete usuario.password;

    // Obtener permisos del usuario
    const [permisos] = await db.query(
      `SELECT m.id as menu_id, m.nombre as menu_nombre, m.icono, m.ruta as menu_ruta,
              s.id as submenu_id, s.nombre as submenu_nombre, s.ruta as submenu_ruta,
              p.puede_ver, p.puede_crear, p.puede_editar, p.puede_eliminar
       FROM permisos p
       LEFT JOIN menus m ON p.menu_id = m.id
       LEFT JOIN submenus s ON p.submenu_id = s.id
       WHERE p.rol_id = ? AND p.puede_ver = TRUE
       ORDER BY m.orden, s.orden`,
      [usuario.rol_id]
    );

    res.json({
      usuario,
      permisos
    });
  } catch (error) {
    console.error('Error al verificar auth:', error);
    res.status(500).json({ error: 'Error al verificar autenticación' });
  }
};

// Cambiar contraseña
export const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const usuarioId = req.usuario.id;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Obtener usuario
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    const usuario = usuarios[0];

    // Verificar contraseña actual
    const passwordValido = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordNuevo, salt);

    // Actualizar contraseña
    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, usuarioId]);

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};
