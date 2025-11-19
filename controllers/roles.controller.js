import db from '../config/database.js';

// Obtener todos los roles
export const obtenerRoles = async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles ORDER BY nombre');
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// Obtener un rol por ID
export const obtenerRolPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json(roles[0]);
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ error: 'Error al obtener rol' });
  }
};

// Crear un nuevo rol
export const crearRol = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del rol es requerido' });
    }

    const [resultado] = await db.query(
      'INSERT INTO roles (nombre, descripcion, activo) VALUES (?, ?, ?)',
      [nombre, descripcion || null, activo !== undefined ? activo : true]
    );

    res.status(201).json({
      mensaje: 'Rol creado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    console.error('Error al crear rol:', error);
    res.status(500).json({ error: 'Error al crear rol' });
  }
};

// Actualizar un rol
export const actualizarRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const [roles] = await db.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    await db.query(
      'UPDATE roles SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, activo, id]
    );

    res.json({ mensaje: 'Rol actualizado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ error: 'Error al actualizar rol' });
  }
};

// Eliminar un rol
export const eliminarRol = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay usuarios con este rol
    const [usuarios] = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol_id = ?', [id]);
    if (usuarios[0].total > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el rol porque hay usuarios asociados a él' 
      });
    }

    const [resultado] = await db.query('DELETE FROM roles WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    res.json({ mensaje: 'Rol eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ error: 'Error al eliminar rol' });
  }
};
