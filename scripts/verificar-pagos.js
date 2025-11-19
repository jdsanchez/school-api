import pool from '../config/database.js';

async function verificarYCrearPagos() {
  try {
    console.log('🔍 Verificando datos en la base de datos...\n');
    
    // 1. Verificar pagos existentes
    const [pagos] = await pool.query('SELECT COUNT(*) as total FROM pagos');
    console.log(`📊 Pagos existentes: ${pagos[0].total}`);
    
    // 2. Verificar alumnos disponibles
    const [alumnos] = await pool.query(`
      SELECT u.id, CONCAT(u.nombre, ' ', u.apellido) as nombre, u.codigo_alumno
      FROM usuarios u
      INNER JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre = 'Alumno'
      LIMIT 5
    `);
    console.log(`\n👨‍🎓 Alumnos disponibles: ${alumnos.length}`);
    alumnos.forEach(a => console.log(`  - ID: ${a.id} | ${a.nombre} (${a.codigo_estudiante})`));
    
    // 3. Verificar cursos con costo
    const [cursos] = await pool.query('SELECT id, codigo, nombre, costo FROM cursos WHERE costo > 0 LIMIT 5');
    console.log(`\n📚 Cursos con costo: ${cursos.length}`);
    cursos.forEach(c => console.log(`  - ID: ${c.id} | ${c.codigo} - ${c.nombre} (Q${c.costo})`));
    
    // 4. Si no hay pagos y hay alumnos y cursos, crear pagos de ejemplo
    if (pagos[0].total === 0 && alumnos.length > 0 && cursos.length > 0) {
      console.log('\n🔧 Creando pagos de ejemplo...');
      
      const pagosPrueba = [
        {
          curso_id: cursos[0].id,
          alumno_id: alumnos[0].id,
          monto: cursos[0].costo,
          metodo_pago: 'Transferencia',
          estado: 'Pendiente',
          fecha_limite: '2025-12-20',
          fecha_pago: new Date(),
          numero_referencia: 'TRF-2025-001',
          observaciones: 'Pago de prueba - Transferencia bancaria'
        }
      ];
      
      // Agregar más pagos si hay más alumnos
      if (alumnos.length > 1 && cursos.length > 0) {
        pagosPrueba.push({
          curso_id: cursos[0].id,
          alumno_id: alumnos[1].id,
          monto: cursos[0].costo,
          metodo_pago: 'Efectivo',
          estado: 'Pendiente',
          fecha_limite: '2025-12-20',
          fecha_pago: new Date(),
          numero_referencia: null,
          observaciones: 'Pago de prueba - Efectivo'
        });
      }
      
      if (alumnos.length > 0 && cursos.length > 1) {
        pagosPrueba.push({
          curso_id: cursos[1].id,
          alumno_id: alumnos[0].id,
          monto: cursos[1].costo,
          metodo_pago: 'Tarjeta',
          estado: 'Pendiente',
          fecha_limite: '2025-12-20',
          fecha_pago: new Date(),
          numero_referencia: 'CARD-2025-001',
          observaciones: 'Pago de prueba - Tarjeta de crédito'
        });
      }
      
      for (const pago of pagosPrueba) {
        await pool.query(
          `INSERT INTO pagos (curso_id, alumno_id, monto, metodo_pago, estado, fecha_limite, fecha_pago, numero_referencia, observaciones) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [pago.curso_id, pago.alumno_id, pago.monto, pago.metodo_pago, pago.estado, pago.fecha_limite, pago.fecha_pago, pago.numero_referencia, pago.observaciones]
        );
      }
      
      console.log(`✅ Se crearon ${pagosPrueba.length} pagos de prueba`);
      
      // Mostrar los pagos creados
      const [nuevosPagos] = await pool.query(`
        SELECT 
          p.id,
          c.nombre as curso,
          c.codigo as codigo_curso,
          CONCAT(u.nombre, ' ', u.apellido) as alumno,
          u.codigo_alumno as codigo_estudiante,
          p.monto,
          p.metodo_pago,
          p.estado,
          p.fecha_limite,
          p.numero_referencia
        FROM pagos p
        INNER JOIN cursos c ON p.curso_id = c.id
        INNER JOIN usuarios u ON p.alumno_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 10
      `);
      
      console.log('\n📋 Pagos en la base de datos:');
      console.table(nuevosPagos);
    } else if (pagos[0].total > 0) {
      // Mostrar pagos existentes
      const [pagosList] = await pool.query(`
        SELECT 
          p.id,
          c.nombre as curso,
          c.codigo as codigo_curso,
          CONCAT(u.nombre, ' ', u.apellido) as alumno,
          u.codigo_alumno as codigo_estudiante,
          p.monto,
          p.metodo_pago,
          p.estado,
          p.fecha_limite,
          p.numero_referencia
        FROM pagos p
        INNER JOIN cursos c ON p.curso_id = c.id
        INNER JOIN usuarios u ON p.alumno_id = u.id
        ORDER BY p.created_at DESC
        LIMIT 10
      `);
      
      console.log('\n📋 Pagos existentes:');
      console.table(pagosList);
    } else {
      console.log('\n⚠️ No se pueden crear pagos de prueba:');
      if (alumnos.length === 0) console.log('  - No hay alumnos en la base de datos');
      if (cursos.length === 0) console.log('  - No hay cursos con costo definido');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit();
  }
}

verificarYCrearPagos();
