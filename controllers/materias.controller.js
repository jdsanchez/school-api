import db from '../config/database.js';

export const obtenerMaterias = async (req, res) => {
  try {
    const [materias] = await db.query('SELECT * FROM materias ORDER BY nombre');
    res.json(materias);
  } catch (error) {
    console.error('Error al obtener materias:', error);
    res.status(500).json({ error: 'Error al obtener materias' });
  }
};

export const obtenerMateriaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const [materias] = await db.query('SELECT * FROM materias WHERE id = ?', [id]);

    if (materias.length === 0) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json(materias[0]);
  } catch (error) {
    console.error('Error al obtener materia:', error);
    res.status(500).json({ error: 'Error al obtener materia' });
  }
};

export const crearMateria = async (req, res) => {
  try {
    const { nombre, codigo, descripcion, grado, creditos, activo } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: 'Nombre y código son requeridos' });
    }

    const [resultado] = await db.query(
      'INSERT INTO materias (nombre, codigo, descripcion, grado, creditos, activo) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, codigo, descripcion || null, grado || null, creditos || 0, activo !== undefined ? activo : true]
    );

    res.status(201).json({
      mensaje: 'Materia creada exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una materia con ese código' });
    }
    console.error('Error al crear materia:', error);
    res.status(500).json({ error: 'Error al crear materia' });
  }
};

export const actualizarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, descripcion, grado, creditos, activo } = req.body;

    const [materias] = await db.query('SELECT * FROM materias WHERE id = ?', [id]);
    if (materias.length === 0) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    await db.query(
      'UPDATE materias SET nombre = ?, codigo = ?, descripcion = ?, grado = ?, creditos = ?, activo = ? WHERE id = ?',
      [nombre, codigo, descripcion, grado, creditos, activo, id]
    );

    res.json({ mensaje: 'Materia actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar materia:', error);
    res.status(500).json({ error: 'Error al actualizar materia' });
  }
};

export const eliminarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const [resultado] = await db.query('DELETE FROM materias WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Materia no encontrada' });
    }

    res.json({ mensaje: 'Materia eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar materia:', error);
    res.status(500).json({ error: 'Error al eliminar materia' });
  }
};
