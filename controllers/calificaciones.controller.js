import db from '../config/database.js';

export const obtenerCalificaciones = async (req, res) => {
  try {
    const { alumno_id, materia_id, periodo } = req.query;
    
    let query = `
      SELECT c.*, 
             u.nombre as alumno_nombre, u.apellido as alumno_apellido,
             m.nombre as materia_nombre,
             r.nombre as registrado_por_nombre
      FROM calificaciones c
      INNER JOIN usuarios u ON c.alumno_id = u.id
      INNER JOIN materias m ON c.materia_id = m.id
      INNER JOIN usuarios r ON c.registrado_por = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (alumno_id) {
      query += ' AND c.alumno_id = ?';
      params.push(alumno_id);
    }
    
    if (materia_id) {
      query += ' AND c.materia_id = ?';
      params.push(materia_id);
    }
    
    if (periodo) {
      query += ' AND c.periodo = ?';
      params.push(periodo);
    }
    
    query += ' ORDER BY c.fecha_evaluacion DESC';
    
    const [calificaciones] = await db.query(query, params);
    res.json(calificaciones);
  } catch (error) {
    console.error('Error al obtener calificaciones:', error);
    res.status(500).json({ error: 'Error al obtener calificaciones' });
  }
};

export const registrarCalificacion = async (req, res) => {
  try {
    const { alumno_id, materia_id, periodo, tipo_evaluacion, nota, nota_maxima, fecha_evaluacion, observaciones } = req.body;
    const registrado_por = req.usuario.id;

    if (!alumno_id || !materia_id || !periodo || !nota) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const [resultado] = await db.query(
      `INSERT INTO calificaciones 
       (alumno_id, materia_id, periodo, tipo_evaluacion, nota, nota_maxima, fecha_evaluacion, observaciones, registrado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [alumno_id, materia_id, periodo, tipo_evaluacion || null, nota, nota_maxima || 100, fecha_evaluacion || null, observaciones || null, registrado_por]
    );

    res.status(201).json({
      mensaje: 'Calificación registrada exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Error al registrar calificación:', error);
    res.status(500).json({ error: 'Error al registrar calificación' });
  }
};

export const actualizarCalificacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { nota, observaciones } = req.body;

    await db.query(
      'UPDATE calificaciones SET nota = ?, observaciones = ? WHERE id = ?',
      [nota, observaciones, id]
    );

    res.json({ mensaje: 'Calificación actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar calificación:', error);
    res.status(500).json({ error: 'Error al actualizar calificación' });
  }
};
