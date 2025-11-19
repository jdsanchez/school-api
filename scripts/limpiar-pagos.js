import pool from '../config/database.js';

async function limpiarPagos() {
  try {
    console.log('🗑️  Limpiando datos de pagos...\n');
    
    // Eliminar notificaciones de pagos
    const [notif] = await pool.query('DELETE FROM notificaciones_pago');
    console.log(`✅ ${notif.affectedRows} notificaciones eliminadas`);
    
    // Eliminar historial de pagos
    const [hist] = await pool.query('DELETE FROM pago_historial');
    console.log(`✅ ${hist.affectedRows} registros de historial eliminados`);
    
    // Eliminar pagos
    const [pagos] = await pool.query('DELETE FROM pagos');
    console.log(`✅ ${pagos.affectedRows} pagos eliminados`);
    
    // Reiniciar auto_increment
    await pool.query('ALTER TABLE pagos AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE pago_historial AUTO_INCREMENT = 1');
    await pool.query('ALTER TABLE notificaciones_pago AUTO_INCREMENT = 1');
    
    console.log('\n✅ Base de datos limpiada exitosamente');
    console.log('📝 Ahora puedes hacer nuevas pruebas de pagos\n');
    
  } catch (error) {
    console.error('❌ Error al limpiar:', error);
  } finally {
    process.exit();
  }
}

limpiarPagos();
