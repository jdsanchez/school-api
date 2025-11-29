import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { enviarEmailRecuperacion } from '../config/email.js';

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

// Recuperar contraseña - Generar token de recuperación
export const recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es requerido' });
    }

    // Buscar usuario por email
    const [usuarios] = await db.query(
      'SELECT id, nombre, apellido, email FROM usuarios WHERE email = ? AND activo = TRUE',
      [email]
    );

    if (usuarios.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({ mensaje: 'Si el correo existe, recibirás un enlace de recuperación' });
    }

    const usuario = usuarios[0];

    // Generar token temporal (válido por 1 hora)
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, tipo: 'recuperacion' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Guardar token en base de datos
    await db.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?',
      [token, usuario.id]
    );

    // Enviar email con el link de recuperación
    const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`;
    const resultadoEmail = await enviarEmailRecuperacion(usuario.email, nombreCompleto, token);
    
    if (!resultadoEmail.success) {
      console.error('Error al enviar email:', resultadoEmail.error);
      // No revelamos el error específico al usuario
    }

    res.json({ 
      mensaje: 'Si el correo existe, recibirás un enlace de recuperación en tu bandeja de entrada'
    });
  } catch (error) {
    console.error('Error al recuperar contraseña:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// Restablecer contraseña con token
export const restablecerPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.tipo !== 'recuperacion') {
        return res.status(400).json({ error: 'Token inválido' });
      }
    } catch (error) {
      return res.status(400).json({ error: 'Token expirado o inválido' });
    }

    // Verificar que el token existe en la base de datos y no ha expirado
    const [usuarios] = await db.query(
      'SELECT id FROM usuarios WHERE id = ? AND reset_token = ? AND reset_token_expira > NOW()',
      [decoded.id, token]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    // Actualizar contraseña y limpiar token
    await db.query(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
      [passwordHash, decoded.id]
    );

    res.json({ mensaje: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};
