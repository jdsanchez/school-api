import db from '../config/database.js';

export const obtenerAsistencias = async (req, res) => {
  try {
    const { alumno_id, curso_id, fecha_inicio, fecha_fin } = req.query;
    
    let query = `
      SELECT a.*, 
             u.nombre as alumno_nombre, u.apellido as alumno_apellido,
             c.nombre as materia_nombre,
             r.nombre as registrado_por_nombre
      FROM asistencia a
      INNER JOIN usuarios u ON a.alumno_id = u.id
      INNER JOIN cursos c ON a.curso_id = c.id
      INNER JOIN usuarios r ON a.registrado_por = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (alumno_id) {
      query += ' AND a.alumno_id = ?';
      params.push(alumno_id);
    }
    
    if (curso_id) {
      query += ' AND a.curso_id = ?';
      params.push(curso_id);
    }
    
    if (fecha_inicio) {
      query += ' AND a.fecha >= ?';
      params.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      query += ' AND a.fecha <= ?';
      params.push(fecha_fin);
    }
    
    query += ' ORDER BY a.fecha DESC, u.apellido, u.nombre';
    
    const [asistencias] = await db.query(query, params);
    res.json(asistencias);
  } catch (error) {
    console.error('Error al obtener asistencias:', error);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
};

export const registrarAsistencia = async (req, res) => {
  try {
    const { alumno_id, curso_id, fecha, estado, observaciones } = req.body;
    const registrado_por = req.usuario.id;

    if (!alumno_id || !curso_id || !fecha || !estado) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const [resultado] = await db.query(
      `INSERT INTO asistencia (alumno_id, curso_id, fecha, estado, observaciones, registrado_por) 
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE estado = ?, observaciones = ?`,
      [alumno_id, curso_id, fecha, estado, observaciones || null, registrado_por, estado, observaciones || null]
    );

    res.status(201).json({
      mensaje: 'Asistencia registrada exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ error: 'Error al registrar asistencia' });
  }
};
