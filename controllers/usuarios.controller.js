import bcrypt from 'bcryptjs';
import db from '../config/database.js';

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const { rol } = req.query;
    
    let query = `
      SELECT u.*, r.nombre as rol_nombre 
      FROM usuarios u 
      INNER JOIN roles r ON u.rol_id = r.id
    `;
    
    const params = [];
    
    if (rol) {
      query += ' WHERE r.nombre = ?';
      params.push(rol);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const [usuarios] = await db.query(query, params);
    
    // Ocultar contraseñas
    usuarios.forEach(u => delete u.password);
    
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener un usuario por ID
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [usuarios] = await db.query(
      `SELECT u.*, r.nombre as rol_nombre 
       FROM usuarios u 
       INNER JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = ?`,
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = usuarios[0];
    delete usuario.password;

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      rol_id,
      codigo_alumno,
      dpi,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      activo
    } = req.body;

    // Validaciones
    if (!nombre || !apellido || !email || !password || !rol_id) {
      return res.status(400).json({ 
        error: 'Nombre, apellido, email, contraseña y rol son requeridos' 
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [resultado] = await db.query(
      `INSERT INTO usuarios 
       (nombre, apellido, email, password, rol_id, codigo_alumno, dpi, telefono, 
        direccion, fecha_nacimiento, genero, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        email,
        passwordHash,
        rol_id,
        codigo_alumno || null,
        dpi || null,
        telefono || null,
        direccion || null,
        fecha_nacimiento || null,
        genero || null,
        activo !== undefined ? activo : true
      ]
    );

    res.status(201).json({
      mensaje: 'Usuario creado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Ya existe un usuario con ese email, código de alumno o DPI' 
      });
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      email,
      rol_id,
      codigo_alumno,
      dpi,
      telefono,
      direccion,
      fecha_nacimiento,
      genero,
      activo
    } = req.body;

    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.query(
      `UPDATE usuarios 
       SET nombre = ?, apellido = ?, email = ?, rol_id = ?, codigo_alumno = ?, 
           dpi = ?, telefono = ?, direccion = ?, fecha_nacimiento = ?, genero = ?, activo = ?
       WHERE id = ?`,
      [
        nombre,
        apellido,
        email,
        rol_id,
        codigo_alumno || null,
        dpi || null,
        telefono || null,
        direccion || null,
        fecha_nacimiento || null,
        genero || null,
        activo,
        id
      ]
    );

    res.json({ mensaje: 'Usuario actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Ya existe un usuario con ese email, código de alumno o DPI' 
      });
    }
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const [resultado] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// Resetear contraseña de un usuario
export const resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    if (!nuevaPassword) {
      return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    }

    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(nuevaPassword, salt);

    await db.query('UPDATE usuarios SET password = ? WHERE id = ?', [passwordHash, id]);

    res.json({ mensaje: 'Contraseña reseteada exitosamente' });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
};
