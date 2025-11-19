import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';

// Obtener todos los pagos con filtros
export const obtenerPagos = async (req, res) => {
  try {
    const { estado, curso_id, alumno_id, fecha_desde, fecha_hasta } = req.query;
    
    console.log('📊 Obtener Pagos - Query params:', { estado, curso_id, alumno_id, fecha_desde, fecha_hasta });
    
    let query = `
      SELECT 
        p.id,
        p.curso_id,
        p.alumno_id,
        p.monto,
        p.metodo_pago,
        p.estado,
        p.fecha_limite,
        p.fecha_pago,
        p.comprobante,
        p.numero_referencia,
        p.observaciones,
        p.confirmado_por,
        p.fecha_confirmacion,
        p.created_at,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        CONCAT(a.nombre, ' ', a.apellido) as alumno_nombre,
        a.codigo_alumno as codigo_estudiante,
        a.email as alumno_email,
        CONCAT(conf.nombre, ' ', conf.apellido) as confirmado_por_nombre
      FROM pagos p
      INNER JOIN cursos c ON p.curso_id = c.id
      INNER JOIN usuarios a ON p.alumno_id = a.id
      LEFT JOIN usuarios conf ON p.confirmado_por = conf.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (estado) {
      query += ' AND p.estado = ?';
      params.push(estado);
    }
    
    if (curso_id) {
      query += ' AND p.curso_id = ?';
      params.push(curso_id);
    }
    
    if (alumno_id) {
      query += ' AND p.alumno_id = ?';
      params.push(alumno_id);
    }
    
    if (fecha_desde) {
      query += ' AND p.fecha_limite >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      query += ' AND p.fecha_limite <= ?';
      params.push(fecha_hasta);
    }
    
    query += ' ORDER BY p.fecha_limite DESC, p.created_at DESC';
    
    const [pagos] = await pool.query(query, params);
    
    // Convertir montos a números
    const pagosConvertidos = pagos.map(pago => ({
      ...pago,
      monto: parseFloat(pago.monto) || 0
    }));
    
    console.log('✅ Pagos encontrados:', pagosConvertidos.length);
    
    res.json(pagosConvertidos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener pagos' });
  }
};

// Obtener historial de pagos de un alumno
export const obtenerHistorialAlumno = async (req, res) => {
  try {
    const { alumno_id } = req.params;
    
    const query = `
      SELECT 
        p.id,
        p.monto,
        p.metodo_pago,
        p.estado,
        p.fecha_limite,
        p.fecha_pago,
        p.comprobante,
        p.numero_referencia,
        p.observaciones,
        p.fecha_confirmacion,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        CONCAT(conf.nombre, ' ', conf.apellido) as confirmado_por_nombre
      FROM pagos p
      INNER JOIN cursos c ON p.curso_id = c.id
      LEFT JOIN usuarios conf ON p.confirmado_por = conf.id
      WHERE p.alumno_id = ?
      ORDER BY p.fecha_limite DESC
    `;
    
    const [pagos] = await pool.query(query, [alumno_id]);
    
    // Convertir montos a números
    const pagosConvertidos = pagos.map(pago => ({
      ...pago,
      monto: parseFloat(pago.monto) || 0
    }));
    
    res.json(pagosConvertidos);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ message: 'Error al obtener historial de pagos' });
  }
};

// Registrar un nuevo pago
export const registrarPago = async (req, res) => {
  try {
    console.log('📝 Registrar Pago - Body:', req.body);
    console.log('📎 Archivo:', req.file);
    
    const {
      curso_id,
      alumno_id,
      monto,
      metodo_pago,
      fecha_limite,
      numero_referencia,
      observaciones
    } = req.body;
    
    console.log('📅 fecha_limite recibida:', fecha_limite);
    
    // Si no se proporciona fecha_limite, calcular una (30 días adelante)
    const fechaLimite = fecha_limite || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Validar que el alumno esté inscrito en el curso
    const [inscripcion] = await pool.query(
      'SELECT id FROM curso_alumnos WHERE curso_id = ? AND alumno_id = ?',
      [curso_id, alumno_id]
    );
    
    if (inscripcion.length === 0) {
      return res.status(400).json({ 
        message: 'El alumno no está inscrito en este curso' 
      });
    }
    
    // Verificar si ya existe un pago confirmado
    const [pagoExistente] = await pool.query(
      'SELECT id, estado FROM pagos WHERE curso_id = ? AND alumno_id = ? AND estado = "Pagado"',
      [curso_id, alumno_id]
    );
    
    if (pagoExistente.length > 0) {
      return res.status(400).json({ 
        mensaje: 'Este curso ya está pagado' 
      });
    }
    
    const comprobante = req.file ? req.file.filename : null;
    
    const query = `
      INSERT INTO pagos (
        curso_id, alumno_id, monto, metodo_pago, estado,
        fecha_limite, fecha_pago, comprobante, numero_referencia, observaciones
      ) VALUES (?, ?, ?, ?, 'Pendiente', ?, NOW(), ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      curso_id,
      alumno_id,
      monto,
      metodo_pago,
      fechaLimite,
      comprobante,
      numero_referencia,
      observaciones
    ]);
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO pago_historial (pago_id, monto, estado_anterior, estado_nuevo, metodo_pago, comprobante, observaciones, registrado_por)
       VALUES (?, ?, NULL, 'Pendiente', ?, ?, ?, ?)`,
      [result.insertId, monto, metodo_pago, comprobante, observaciones, alumno_id]
    );
    
    // Crear notificación
    await pool.query(
      `INSERT INTO notificaciones_pago (pago_id, alumno_id, tipo, mensaje)
       VALUES (?, ?, 'Recordatorio', ?)`,
      [result.insertId, alumno_id, `Pago registrado para el curso. Fecha límite: ${fechaLimite}`]
    );
    
    res.status(201).json({
      message: 'Pago registrado exitosamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ message: 'Error al registrar pago' });
  }
};

// Actualizar un pago
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monto,
      metodo_pago,
      fecha_limite,
      numero_referencia,
      observaciones
    } = req.body;
    
    // Obtener el pago actual
    const [pagoActual] = await pool.query('SELECT * FROM pagos WHERE id = ?', [id]);
    
    if (pagoActual.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    
    if (pagoActual[0].estado === 'Pagado') {
      return res.status(400).json({ 
        message: 'No se puede actualizar un pago confirmado' 
      });
    }
    
    const comprobante = req.file ? req.file.filename : pagoActual[0].comprobante;
    
    // Si hay un nuevo comprobante y existía uno anterior, eliminar el anterior
    if (req.file && pagoActual[0].comprobante) {
      const oldPath = path.join(__dirname, '../uploads/comprobantes', pagoActual[0].comprobante);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const query = `
      UPDATE pagos SET
        monto = ?,
        metodo_pago = ?,
        fecha_limite = ?,
        comprobante = ?,
        numero_referencia = ?,
        observaciones = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [
      monto,
      metodo_pago,
      fecha_limite,
      comprobante,
      numero_referencia,
      observaciones,
      id
    ]);
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO pago_historial (pago_id, monto, estado_anterior, estado_nuevo, metodo_pago, comprobante, observaciones, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, monto, pagoActual[0].estado, pagoActual[0].estado, metodo_pago, comprobante, observaciones, pagoActual[0].alumno_id]
    );
    
    res.json({ message: 'Pago actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ message: 'Error al actualizar pago' });
  }
};

// Confirmar un pago (Admin/Director)
export const confirmarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmado_por, observaciones } = req.body;
    
    console.log('✅ Confirmar Pago - ID:', id);
    console.log('✅ Confirmar Pago - Body:', { confirmado_por, observaciones });
    
    // Validar que confirmado_por esté presente
    if (!confirmado_por) {
      return res.status(400).json({ 
        message: 'El campo confirmado_por es requerido' 
      });
    }
    
    // Obtener el pago actual
    const [pago] = await pool.query(
      'SELECT p.*, a.email as alumno_email FROM pagos p INNER JOIN usuarios a ON p.alumno_id = a.id WHERE p.id = ?',
      [id]
    );
    
    console.log('📝 Pago encontrado:', pago.length > 0 ? pago[0] : 'No encontrado');
    
    if (pago.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    
    if (pago[0].estado === 'Pagado') {
      return res.status(400).json({ message: 'Este pago ya fue confirmado' });
    }
    
    const query = `
      UPDATE pagos SET
        estado = 'Pagado',
        fecha_pago = NOW(),
        confirmado_por = ?,
        fecha_confirmacion = NOW(),
        observaciones = CONCAT(COALESCE(observaciones, ''), '\n', ?)
      WHERE id = ?
    `;
    
    console.log('🔄 Ejecutando UPDATE...');
    
    await pool.query(query, [
      confirmado_por,
      observaciones || 'Pago confirmado',
      id
    ]);
    
    console.log('✅ UPDATE ejecutado correctamente');
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO pago_historial (pago_id, monto, estado_anterior, estado_nuevo, metodo_pago, observaciones, registrado_por)
       VALUES (?, ?, 'Pendiente', 'Pagado', ?, ?, ?)`,
      [id, pago[0].monto, pago[0].metodo_pago, observaciones || 'Pago confirmado', confirmado_por]
    );
    
    console.log('✅ Historial registrado');
    
    // Crear notificación de confirmación
    await pool.query(
      `INSERT INTO notificaciones_pago (pago_id, alumno_id, tipo, mensaje)
       VALUES (?, ?, 'Confirmado', ?)`,
      [id, pago[0].alumno_id, 'Tu pago ha sido confirmado exitosamente']
    );
    
    console.log('✅ Notificación creada');
    
    res.json({ message: 'Pago confirmado exitosamente' });
  } catch (error) {
    console.error('❌ Error al confirmar pago:', error);
    res.status(500).json({ message: 'Error al confirmar pago', error: error.message });
  }
};

// Rechazar un pago (Admin/Director)
export const rechazarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { rechazado_por, observaciones } = req.body;
    
    if (!observaciones) {
      return res.status(400).json({ 
        message: 'Debe proporcionar un motivo de rechazo' 
      });
    }
    
    const [pago] = await pool.query('SELECT * FROM pagos WHERE id = ?', [id]);
    
    if (pago.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }
    
    const query = `
      UPDATE pagos SET
        estado = 'Cancelado',
        observaciones = CONCAT(COALESCE(observaciones, ''), '\nRECHAZADO: ', ?)
      WHERE id = ?
    `;
    
    await pool.query(query, [observaciones, id]);
    
    // Registrar en historial
    await pool.query(
      `INSERT INTO pago_historial (pago_id, monto, estado_anterior, estado_nuevo, observaciones, registrado_por)
       VALUES (?, ?, ?, 'Cancelado', ?, ?)`,
      [id, pago[0].monto, pago[0].estado, `RECHAZADO: ${observaciones}`, rechazado_por]
    );
    
    // Notificar al alumno
    await pool.query(
      `INSERT INTO notificaciones_pago (pago_id, alumno_id, tipo, mensaje)
       VALUES (?, ?, 'Atrasado', ?)`,
      [id, pago[0].alumno_id, `Tu pago fue rechazado. Motivo: ${observaciones}`]
    );
    
    res.json({ message: 'Pago rechazado' });
  } catch (error) {
    console.error('Error al rechazar pago:', error);
    res.status(500).json({ message: 'Error al rechazar pago' });
  }
};

// Obtener notificaciones de un alumno
export const obtenerNotificaciones = async (req, res) => {
  try {
    const { alumno_id } = req.params;
    
    const query = `
      SELECT 
        n.id,
        n.pago_id,
        n.tipo,
        n.mensaje,
        n.leido,
        n.fecha_envio,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo,
        p.monto,
        p.estado as pago_estado
      FROM notificaciones_pago n
      INNER JOIN pagos p ON n.pago_id = p.id
      INNER JOIN cursos c ON p.curso_id = c.id
      WHERE n.alumno_id = ?
      ORDER BY n.fecha_envio DESC
      LIMIT 50
    `;
    
    const [notificaciones] = await pool.query(query, [alumno_id]);
    
    // Convertir montos a números
    const notificacionesConvertidas = notificaciones.map(notif => ({
      ...notif,
      monto: parseFloat(notif.monto) || 0
    }));
    
    res.json(notificacionesConvertidas);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener notificaciones' });
  }
};

// Marcar notificación como leída
export const marcarNotificacionLeida = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE notificaciones_pago SET leido = TRUE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ message: 'Error al marcar notificación' });
  }
};

// Verificar pagos atrasados y enviar notificaciones
export const verificarPagosAtrasados = async (req, res) => {
  try {
    const [pagosAtrasados] = await pool.query(`
      SELECT id, alumno_id, fecha_limite 
      FROM pagos 
      WHERE estado = 'Pendiente' 
      AND fecha_limite < CURDATE()
    `);
    
    for (const pago of pagosAtrasados) {
      // Actualizar estado a Atrasado
      await pool.query(
        'UPDATE pagos SET estado = "Atrasado" WHERE id = ?',
        [pago.id]
      );
      
      // Crear notificación
      await pool.query(
        `INSERT INTO notificaciones_pago (pago_id, alumno_id, tipo, mensaje)
         VALUES (?, ?, 'Atrasado', ?)`,
        [pago.id, pago.alumno_id, `Tu pago está atrasado. Fecha límite: ${pago.fecha_limite}`]
      );
    }
    
    res.json({
      message: 'Verificación completada',
      pagosAtrasados: pagosAtrasados.length
    });
  } catch (error) {
    console.error('Error al verificar pagos:', error);
    res.status(500).json({ message: 'Error al verificar pagos' });
  }
};

// Obtener estadísticas de pagos
export const obtenerEstadisticas = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_pagos,
        SUM(CASE WHEN estado = 'Pagado' THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'Atrasado' THEN 1 ELSE 0 END) as atrasados,
        SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) as total_recaudado,
        SUM(CASE WHEN estado != 'Pagado' AND estado != 'Cancelado' THEN monto ELSE 0 END) as total_pendiente
      FROM pagos
    `);
    
    const [pagosPorCurso] = await pool.query(`
      SELECT 
        c.nombre as curso,
        c.codigo,
        COUNT(p.id) as total_pagos,
        SUM(CASE WHEN p.estado = 'Pagado' THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN p.estado = 'Pagado' THEN p.monto ELSE 0 END) as recaudado
      FROM cursos c
      LEFT JOIN pagos p ON c.id = p.curso_id
      WHERE c.activo = TRUE
      GROUP BY c.id, c.nombre, c.codigo
    `);
    
    // Convertir valores numéricos de string a number
    const resumen = {
      total_pagos: parseInt(stats[0].total_pagos) || 0,
      pagados: parseInt(stats[0].pagados) || 0,
      pendientes: parseInt(stats[0].pendientes) || 0,
      atrasados: parseInt(stats[0].atrasados) || 0,
      total_recaudado: parseFloat(stats[0].total_recaudado) || 0,
      total_pendiente: parseFloat(stats[0].total_pendiente) || 0
    };

    res.json({
      resumen: resumen,
      por_curso: pagosPorCurso
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

// Obtener mis pagos (para alumno)
export const obtenerMisPagos = async (req, res) => {
  try {
    const alumno_id = req.usuario.id;
    
    const [pagos] = await pool.query(
      `SELECT 
        p.id,
        p.curso_id,
        p.monto,
        p.metodo_pago,
        p.estado,
        p.fecha_limite,
        p.fecha_pago,
        p.comprobante,
        p.numero_referencia,
        p.observaciones,
        p.fecha_confirmacion,
        c.nombre as curso_nombre,
        c.codigo as curso_codigo
      FROM pagos p
      INNER JOIN cursos c ON p.curso_id = c.id
      WHERE p.alumno_id = ?
      ORDER BY p.created_at DESC`,
      [alumno_id]
    );
    
    // Convertir montos a números
    const pagosConvertidos = pagos.map(pago => ({
      ...pago,
      monto: parseFloat(pago.monto) || 0
    }));
    
    res.json(pagosConvertidos);
  } catch (error) {
    console.error('Error al obtener mis pagos:', error);
    res.status(500).json({ mensaje: 'Error al obtener tus pagos' });
  }
};
