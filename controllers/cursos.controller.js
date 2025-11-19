import db from '../config/database.js';

// Obtener todos los cursos
export const obtenerCursos = async (req, res) => {
  try {
    const { maestro_id, activo } = req.query;
    const usuario_id = req.usuario?.id; // ID del usuario autenticado
    
    let query = `
      SELECT 
        c.*,
        CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
        u.email as maestro_email,
        (SELECT COUNT(*) FROM curso_alumnos WHERE curso_id = c.id AND estado IN ('Inscrito', 'Activo')) as alumnos_inscritos,
        (SELECT COUNT(*) FROM tareas WHERE curso_id = c.id AND activo = TRUE) as total_tareas`;
    
    // Si el usuario está autenticado, agregar información de inscripción y pago
    if (usuario_id) {
      query += `,
        (SELECT COUNT(*) FROM curso_alumnos WHERE curso_id = c.id AND alumno_id = ?) as esta_inscrito,
        (SELECT COUNT(*) FROM pagos WHERE curso_id = c.id AND alumno_id = ? AND estado = 'Pagado') as pago_realizado,
        (SELECT estado FROM pagos WHERE curso_id = c.id AND alumno_id = ? ORDER BY id DESC LIMIT 1) as estado_pago,
        (SELECT id FROM pagos WHERE curso_id = c.id AND alumno_id = ? ORDER BY id DESC LIMIT 1) as pago_id`;
    }
    
    query += `
      FROM cursos c
      INNER JOIN usuarios u ON c.maestro_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Agregar parámetros para inscripción y pago si hay usuario
    if (usuario_id) {
      params.push(usuario_id, usuario_id, usuario_id, usuario_id);
    }
    
    if (maestro_id) {
      query += ' AND c.maestro_id = ?';
      params.push(maestro_id);
    }
    
    if (activo !== undefined) {
      query += ' AND c.activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }
    
    query += ' ORDER BY c.fecha_inicio DESC, c.codigo';
    
    const [cursos] = await db.query(query, params);
    
    // Convertir 0/1 a booleanos para esta_inscrito y pago_realizado
    const cursosFormateados = cursos.map(curso => ({
      ...curso,
      costo: parseFloat(curso.costo) || 0,
      esta_inscrito: curso.esta_inscrito > 0,
      pago_realizado: curso.pago_realizado > 0
    }));
    
    res.json(cursosFormateados);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ mensaje: 'Error al obtener cursos' });
  }
};

// Obtener un curso por ID
export const obtenerCursoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [cursos] = await db.query(
      `SELECT 
        c.*,
        CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
        u.email as maestro_email,
        u.telefono as maestro_telefono
      FROM cursos c
      INNER JOIN usuarios u ON c.maestro_id = u.id
      WHERE c.id = ?`,
      [id]
    );
    
    if (cursos.length === 0) {
      return res.status(404).json({ mensaje: 'Curso no encontrado' });
    }
    
    // Obtener alumnos inscritos
    const [alumnos] = await db.query(
      `SELECT 
        ca.id as inscripcion_id,
        ca.fecha_inscripcion,
        ca.estado,
        ca.nota_final,
        CONCAT(u.nombre, ' ', u.apellido) as alumno_nombre,
        u.email as alumno_email,
        u.codigo_alumno
      FROM curso_alumnos ca
      INNER JOIN usuarios u ON ca.alumno_id = u.id
      WHERE ca.curso_id = ?
      ORDER BY u.apellido, u.nombre`,
      [id]
    );
    
    res.json({
      ...cursos[0],
      alumnos
    });
  } catch (error) {
    console.error('Error al obtener curso:', error);
    res.status(500).json({ mensaje: 'Error al obtener curso' });
  }
};

// Crear nuevo curso
export const crearCurso = async (req, res) => {
  try {
    const {
      nombre,
      codigo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      maestro_id,
      cupo_maximo,
      creditos,
      horario,
      aula
    } = req.body;
    
    // Validaciones
    if (!nombre || !codigo || !fecha_inicio || !fecha_fin || !maestro_id) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }
    
    // Verificar que el maestro existe y tiene rol de maestro
    const [maestro] = await db.query(
      'SELECT id, rol_id FROM usuarios WHERE id = ?',
      [maestro_id]
    );
    
    if (maestro.length === 0) {
      return res.status(404).json({ mensaje: 'Maestro no encontrado' });
    }
    
    const [result] = await db.query(
      `INSERT INTO cursos 
       (nombre, codigo, descripcion, fecha_inicio, fecha_fin, maestro_id, cupo_maximo, creditos, horario, aula)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, codigo, descripcion, fecha_inicio, fecha_fin, maestro_id, cupo_maximo || 30, creditos || 0, horario, aula]
    );
    
    res.status(201).json({
      mensaje: 'Curso creado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear curso:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El código del curso ya existe' });
    }
    res.status(500).json({ mensaje: 'Error al crear curso' });
  }
};

// Actualizar curso
export const actualizarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      codigo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      maestro_id,
      cupo_maximo,
      creditos,
      horario,
      aula,
      activo
    } = req.body;
    
    await db.query(
      `UPDATE cursos 
       SET nombre = ?, codigo = ?, descripcion = ?, fecha_inicio = ?, 
           fecha_fin = ?, maestro_id = ?, cupo_maximo = ?, creditos = ?, horario = ?, aula = ?, activo = ?
       WHERE id = ?`,
      [nombre, codigo, descripcion, fecha_inicio, fecha_fin, maestro_id, cupo_maximo, creditos, horario, aula, activo, id]
    );
    
    res.json({ mensaje: 'Curso actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar curso:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El código del curso ya existe' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar curso' });
  }
};

// Eliminar curso
export const eliminarCurso = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay alumnos inscritos
    const [inscritos] = await db.query(
      'SELECT COUNT(*) as total FROM curso_alumnos WHERE curso_id = ?',
      [id]
    );
    
    if (inscritos[0].total > 0) {
      return res.status(400).json({ 
        mensaje: 'No se puede eliminar el curso porque tiene alumnos inscritos. Desactívalo en su lugar.' 
      });
    }
    
    await db.query('DELETE FROM cursos WHERE id = ?', [id]);
    res.json({ mensaje: 'Curso eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar curso:', error);
    res.status(500).json({ mensaje: 'Error al eliminar curso' });
  }
};

// Inscribir alumno a un curso
export const inscribirAlumno = async (req, res) => {
  try {
    const { curso_id, alumno_id, observaciones } = req.body;
    
    // Verificar cupo disponible
    const [curso] = await db.query(
      `SELECT c.cupo_maximo, 
        (SELECT COUNT(*) FROM curso_alumnos WHERE curso_id = c.id AND estado IN ('Inscrito', 'Activo')) as inscritos
       FROM cursos c WHERE c.id = ?`,
      [curso_id]
    );
    
    if (curso.length === 0) {
      return res.status(404).json({ mensaje: 'Curso no encontrado' });
    }
    
    if (curso[0].inscritos >= curso[0].cupo_maximo) {
      return res.status(400).json({ mensaje: 'El curso ha alcanzado su cupo máximo' });
    }
    
    await db.query(
      `INSERT INTO curso_alumnos (curso_id, alumno_id, estado, observaciones)
       VALUES (?, ?, 'Inscrito', ?)`,
      [curso_id, alumno_id, observaciones]
    );
    
    res.status(201).json({ mensaje: 'Alumno inscrito exitosamente' });
  } catch (error) {
    console.error('Error al inscribir alumno:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El alumno ya está inscrito en este curso' });
    }
    res.status(500).json({ mensaje: 'Error al inscribir alumno' });
  }
};

// Actualizar estado de inscripción
export const actualizarInscripcion = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota_final, observaciones } = req.body;
    
    await db.query(
      `UPDATE curso_alumnos 
       SET estado = ?, nota_final = ?, observaciones = ?
       WHERE id = ?`,
      [estado, nota_final, observaciones, id]
    );
    
    res.json({ mensaje: 'Inscripción actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar inscripción:', error);
    res.status(500).json({ mensaje: 'Error al actualizar inscripción' });
  }
};

// Obtener maestros disponibles
export const obtenerMaestros = async (req, res) => {
  try {
    const [maestros] = await db.query(
      `SELECT 
        u.id,
        CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
        u.email,
        u.telefono,
        (SELECT COUNT(*) FROM cursos WHERE maestro_id = u.id AND activo = TRUE) as cursos_activos
      FROM usuarios u
      WHERE u.rol_id = (SELECT id FROM roles WHERE nombre = 'Maestro')
        AND u.activo = TRUE
      ORDER BY u.apellido, u.nombre`
    );
    
    res.json(maestros);
  } catch (error) {
    console.error('Error al obtener maestros:', error);
    res.status(500).json({ mensaje: 'Error al obtener maestros' });
  }
};

// Obtener alumnos inscritos en un curso
export const obtenerAlumnosPorCurso = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [alumnos] = await db.query(
      `SELECT 
        u.id,
        CONCAT(u.nombre, ' ', u.apellido) as nombre_completo,
        u.nombre,
        u.apellido,
        u.codigo_alumno as codigo_estudiante,
        u.email,
        u.telefono,
        ca.fecha_inscripcion,
        ca.estado as estado_inscripcion,
        ca.nota_final,
        p.id as pago_id,
        p.estado as estado_pago,
        COALESCE(p.monto, 0) as monto_pagado,
        p.metodo_pago,
        p.fecha_pago
      FROM curso_alumnos ca
      INNER JOIN usuarios u ON ca.alumno_id = u.id
      LEFT JOIN pagos p ON p.curso_id = ca.curso_id AND p.alumno_id = ca.alumno_id
      WHERE ca.curso_id = ?
      ORDER BY ca.fecha_inscripcion DESC`,
      [id]
    );
    
    res.json(alumnos);
  } catch (error) {
    console.error('Error al obtener alumnos:', error);
    res.status(500).json({ mensaje: 'Error al obtener alumnos inscritos' });
  }
};

// Obtener mis asignaciones de cursos (para alumno)
export const obtenerMisAsignaciones = async (req, res) => {
  try {
    const alumno_id = req.usuario.id;
    
    const [asignaciones] = await db.query(
      `SELECT 
        ca.id,
        ca.curso_id,
        c.nombre,
        c.codigo,
        c.descripcion,
        c.fecha_inicio,
        c.fecha_fin,
        c.creditos,
        c.costo,
        c.horario,
        c.aula,
        CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
        ca.fecha_inscripcion,
        ca.estado as estado_inscripcion,
        ca.nota_final,
        p.estado as estado_pago,
        p.monto as monto_pago,
        p.fecha_pago
      FROM curso_alumnos ca
      INNER JOIN cursos c ON ca.curso_id = c.id
      INNER JOIN usuarios u ON c.maestro_id = u.id
      LEFT JOIN pagos p ON p.curso_id = ca.curso_id AND p.alumno_id = ca.alumno_id
      WHERE ca.alumno_id = ?
      ORDER BY ca.fecha_inscripcion DESC`,
      [alumno_id]
    );
    
    res.json(asignaciones);
  } catch (error) {
    console.error('Error al obtener mis asignaciones:', error);
    res.status(500).json({ mensaje: 'Error al obtener tus asignaciones' });
  }
};
