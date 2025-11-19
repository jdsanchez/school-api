import db from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener todas las tareas de un curso
export const obtenerTareasPorCurso = async (req, res) => {
  try {
    const { curso_id } = req.params;
    const usuario = req.usuario;

    const [tareas] = await db.query(
      `SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.fecha_asignacion,
        t.fecha_entrega,
        t.puntos_totales,
        t.archivo_adjunto,
        t.activo,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        CONCAT(u.nombre, ' ', u.apellido) as creado_por_nombre,
        (SELECT COUNT(*) FROM tarea_entregas WHERE tarea_id = t.id) as total_entregas,
        (SELECT COUNT(*) FROM tarea_entregas WHERE tarea_id = t.id AND calificacion IS NOT NULL) as entregas_calificadas
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN usuarios u ON t.creado_por = u.id
      WHERE t.curso_id = ? AND t.activo = TRUE
      ORDER BY t.fecha_entrega DESC`,
      [curso_id]
    );

    // Si es alumno, agregar su estado de entrega
    if (usuario.rol_nombre === 'Alumno') {
      const tareasConEstado = await Promise.all(
        tareas.map(async (tarea) => {
          const [entrega] = await db.query(
            `SELECT id, fecha_entrega, archivo_entrega, estado, calificacion, comentarios, calificado_por
             FROM tarea_entregas 
             WHERE tarea_id = ? AND alumno_id = ?`,
            [tarea.id, usuario.id]
          );
          return {
            ...tarea,
            mi_entrega: entrega[0] || null,
            entregada: entrega.length > 0
          };
        })
      );
      return res.json(tareasConEstado);
    }

    res.json(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ mensaje: 'Error al obtener tareas' });
  }
};

// Obtener detalle de una tarea
export const obtenerTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const [tareas] = await db.query(
      `SELECT 
        t.*,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        CONCAT(u.nombre, ' ', u.apellido) as creado_por_nombre
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN usuarios u ON t.creado_por = u.id
      WHERE t.id = ?`,
      [id]
    );

    if (tareas.length === 0) {
      return res.status(404).json({ mensaje: 'Tarea no encontrada' });
    }

    const tarea = tareas[0];

    // Si es alumno, agregar su entrega
    if (usuario.rol_nombre === 'Alumno') {
      const [entrega] = await db.query(
        `SELECT * FROM tarea_entregas WHERE tarea_id = ? AND alumno_id = ?`,
        [id, usuario.id]
      );
      tarea.mi_entrega = entrega[0] || null;
    }

    res.json(tarea);
  } catch (error) {
    console.error('Error al obtener tarea:', error);
    res.status(500).json({ mensaje: 'Error al obtener tarea' });
  }
};

// Crear tarea
export const crearTarea = async (req, res) => {
  try {
    const { curso_id, titulo, descripcion, fecha_entrega, puntos_totales } = req.body;
    const creado_por = req.usuario.id;
    const archivo_adjunto = req.file ? req.file.filename : null;

    const [result] = await db.query(
      `INSERT INTO tareas (curso_id, titulo, descripcion, fecha_entrega, puntos_totales, archivo_adjunto, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [curso_id, titulo, descripcion, fecha_entrega, puntos_totales, archivo_adjunto, creado_por]
    );

    res.status(201).json({ 
      mensaje: 'Tarea creada exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ mensaje: 'Error al crear tarea' });
  }
};

// Actualizar tarea
export const actualizarTarea = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha_entrega, puntos_totales } = req.body;
    let archivo_adjunto = null;

    if (req.file) {
      // Eliminar archivo anterior si existe
      const [tareaAnterior] = await db.query('SELECT archivo_adjunto FROM tareas WHERE id = ?', [id]);
      if (tareaAnterior[0]?.archivo_adjunto) {
        const archivoPath = path.join(__dirname, '..', 'uploads', 'tareas', tareaAnterior[0].archivo_adjunto);
        if (fs.existsSync(archivoPath)) {
          fs.unlinkSync(archivoPath);
        }
      }
      archivo_adjunto = req.file.filename;
    }

    if (archivo_adjunto) {
      await db.query(
        `UPDATE tareas SET titulo = ?, descripcion = ?, fecha_entrega = ?, puntos_totales = ?, archivo_adjunto = ? WHERE id = ?`,
        [titulo, descripcion, fecha_entrega, puntos_totales, archivo_adjunto, id]
      );
    } else {
      await db.query(
        `UPDATE tareas SET titulo = ?, descripcion = ?, fecha_entrega = ?, puntos_totales = ? WHERE id = ?`,
        [titulo, descripcion, fecha_entrega, puntos_totales, id]
      );
    }

    res.json({ mensaje: 'Tarea actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar tarea:', error);
    res.status(500).json({ mensaje: 'Error al actualizar tarea' });
  }
};

// Eliminar tarea
export const eliminarTarea = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si hay entregas
    const [entregas] = await db.query('SELECT COUNT(*) as total FROM tarea_entregas WHERE tarea_id = ?', [id]);
    
    if (entregas[0].total > 0) {
      // Desactivar en lugar de eliminar
      await db.query('UPDATE tareas SET activo = FALSE WHERE id = ?', [id]);
      return res.json({ mensaje: 'Tarea desactivada (tiene entregas asociadas)' });
    }

    // Eliminar archivo si existe
    const [tarea] = await db.query('SELECT archivo_adjunto FROM tareas WHERE id = ?', [id]);
    if (tarea[0]?.archivo_adjunto) {
      const archivoPath = path.join(__dirname, '..', 'uploads', 'tareas', tarea[0].archivo_adjunto);
      if (fs.existsSync(archivoPath)) {
        fs.unlinkSync(archivoPath);
      }
    }

    await db.query('DELETE FROM tareas WHERE id = ?', [id]);
    res.json({ mensaje: 'Tarea eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ mensaje: 'Error al eliminar tarea' });
  }
};

// Entregar tarea (alumno)
export const entregarTarea = async (req, res) => {
  try {
    const { tarea_id } = req.params;
    const alumno_id = req.usuario.id;
    const { comentarios } = req.body;
    const archivo_entrega = req.file ? req.file.filename : null;

    // Verificar si ya entregó
    const [entregaExistente] = await db.query(
      'SELECT id FROM tarea_entregas WHERE tarea_id = ? AND alumno_id = ?',
      [tarea_id, alumno_id]
    );

    if (entregaExistente.length > 0) {
      // Actualizar entrega existente
      await db.query(
        `UPDATE tarea_entregas SET archivo_entrega = ?, comentarios = ?, fecha_entrega = NOW(), estado = 'Entregada'
         WHERE id = ?`,
        [archivo_entrega, comentarios, entregaExistente[0].id]
      );
      return res.json({ mensaje: 'Tarea actualizada exitosamente' });
    }

    // Crear nueva entrega
    await db.query(
      `INSERT INTO tarea_entregas (tarea_id, alumno_id, archivo_entrega, comentarios, estado)
       VALUES (?, ?, ?, ?, 'Entregada')`,
      [tarea_id, alumno_id, archivo_entrega, comentarios]
    );

    res.status(201).json({ mensaje: 'Tarea entregada exitosamente' });
  } catch (error) {
    console.error('Error al entregar tarea:', error);
    res.status(500).json({ mensaje: 'Error al entregar tarea' });
  }
};

// Obtener entregas de una tarea (maestro/admin)
export const obtenerEntregas = async (req, res) => {
  try {
    const { tarea_id } = req.params;

    const [entregas] = await db.query(
      `SELECT 
        te.*,
        CONCAT(a.nombre, ' ', a.apellido) as alumno_nombre,
        a.codigo_alumno,
        a.email as alumno_email,
        CONCAT(c.nombre, ' ', c.apellido) as calificado_por_nombre
      FROM tarea_entregas te
      INNER JOIN usuarios a ON te.alumno_id = a.id
      LEFT JOIN usuarios c ON te.calificado_por = c.id
      WHERE te.tarea_id = ?
      ORDER BY te.fecha_entrega DESC`,
      [tarea_id]
    );

    res.json(entregas);
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    res.status(500).json({ mensaje: 'Error al obtener entregas' });
  }
};

// Calificar entrega
export const calificarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { calificacion, comentarios } = req.body;
    const calificado_por = req.usuario.id;

    await db.query(
      `UPDATE tarea_entregas 
       SET calificacion = ?, comentarios = ?, calificado_por = ?, fecha_calificacion = NOW(), estado = 'Calificada'
       WHERE id = ?`,
      [calificacion, comentarios, calificado_por, id]
    );

    res.json({ mensaje: 'Entrega calificada exitosamente' });
  } catch (error) {
    console.error('Error al calificar entrega:', error);
    res.status(500).json({ mensaje: 'Error al calificar entrega' });
  }
};

// Obtener mis tareas (alumno)
export const obtenerMisTareas = async (req, res) => {
  try {
    const alumno_id = req.usuario.id;

    const [tareas] = await db.query(
      `SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.fecha_asignacion,
        t.fecha_entrega,
        t.puntos_totales,
        t.archivo_adjunto,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        c.id as curso_id,
        CONCAT(u.nombre, ' ', u.apellido) as maestro_nombre,
        te.id as entrega_id,
        te.fecha_entrega as fecha_mi_entrega,
        te.archivo_entrega,
        te.estado,
        te.calificacion,
        te.comentarios as comentarios_calificacion
      FROM tareas t
      INNER JOIN cursos c ON t.curso_id = c.id
      INNER JOIN curso_alumnos ca ON c.id = ca.curso_id
      INNER JOIN usuarios u ON c.maestro_id = u.id
      LEFT JOIN tarea_entregas te ON t.id = te.tarea_id AND te.alumno_id = ?
      WHERE ca.alumno_id = ? AND t.activo = TRUE
      ORDER BY t.fecha_entrega DESC`,
      [alumno_id, alumno_id]
    );

    res.json(tareas);
  } catch (error) {
    console.error('Error al obtener mis tareas:', error);
    res.status(500).json({ mensaje: 'Error al obtener tus tareas' });
  }
};
