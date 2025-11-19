import bcrypt from 'bcryptjs';
import db from '../config/database.js';

async function insertarDatosPrueba() {
  try {
    console.log('🔄 Insertando datos de prueba...');

    // Hash de contraseñas
    const salt = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash('admin123', salt);
    const passwordDirector = await bcrypt.hash('director123', salt);
    const passwordMaestro = await bcrypt.hash('maestro123', salt);
    const passwordAlumno = await bcrypt.hash('alumno123', salt);
    const passwordPadre = await bcrypt.hash('padre123', salt);

    // Obtener IDs de roles
    const [roles] = await db.query('SELECT * FROM roles');
    const adminRol = roles.find(r => r.nombre === 'Admin');
    const directorRol = roles.find(r => r.nombre === 'Director');
    const maestroRol = roles.find(r => r.nombre === 'Maestro');
    const alumnoRol = roles.find(r => r.nombre === 'Alumno');
    const padresRol = roles.find(r => r.nombre === 'Padres');

    // Insertar usuarios
    // Admin ya existe en schema.sql, solo actualizamos la contraseña
    await db.query(
      `UPDATE usuarios SET password = ? WHERE email = ?`,
      [passwordAdmin, 'admin@classoptima.com']
    );

    // Director
    await db.query(
      `INSERT INTO usuarios (nombre, apellido, email, password, rol_id, dpi, telefono) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['María', 'Directora', 'director@classoptima.com', passwordDirector, directorRol.id, '1234567890102', '87654321']
    );

    // Maestros
    const maestros = [
      ['Carlos', 'Rodríguez', 'carlos.rodriguez@classoptima.com', 'MAE001', '1234567890201'],
      ['Ana', 'López', 'ana.lopez@classoptima.com', 'MAE002', '1234567890202'],
      ['Pedro', 'Martínez', 'pedro.martinez@classoptima.com', 'MAE003', '1234567890203']
    ];

    for (const maestro of maestros) {
      await db.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, rol_id, codigo_alumno, dpi, telefono) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [maestro[0], maestro[1], maestro[2], passwordMaestro, maestroRol.id, maestro[3], maestro[4], '99999999']
      );
    }

    // Alumnos
    const alumnos = [
      ['José', 'García', 'jose.garcia@classoptima.com', 'ALU001', '2005-05-15', 'M'],
      ['Laura', 'Fernández', 'laura.fernandez@classoptima.com', 'ALU002', '2006-08-20', 'F'],
      ['Miguel', 'Torres', 'miguel.torres@classoptima.com', 'ALU003', '2005-12-10', 'M'],
      ['Sofía', 'Ramírez', 'sofia.ramirez@classoptima.com', 'ALU004', '2006-03-25', 'F'],
      ['Daniel', 'Vargas', 'daniel.vargas@classoptima.com', 'ALU005', '2005-07-18', 'M']
    ];

    for (const alumno of alumnos) {
      await db.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, rol_id, codigo_alumno, fecha_nacimiento, genero, telefono) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [alumno[0], alumno[1], alumno[2], passwordAlumno, alumnoRol.id, alumno[3], alumno[4], alumno[5], '55555555']
      );
    }

    // Padres
    const padres = [
      ['Roberto', 'García Pérez', 'roberto.garcia@classoptima.com', '1234567890301'],
      ['Carmen', 'Fernández Díaz', 'carmen.fernandez@classoptima.com', '1234567890302']
    ];

    for (const padre of padres) {
      await db.query(
        `INSERT INTO usuarios (nombre, apellido, email, password, rol_id, dpi, telefono) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [padre[0], padre[1], padre[2], passwordPadre, padresRol.id, padre[3], '66666666']
      );
    }

    // Asignar permisos completos al Admin
    const [menus] = await db.query('SELECT * FROM menus');
    const [submenus] = await db.query('SELECT * FROM submenus');

    for (const menu of menus) {
      await db.query(
        `INSERT INTO permisos (rol_id, menu_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
         VALUES (?, ?, TRUE, TRUE, TRUE, TRUE)`,
        [adminRol.id, menu.id]
      );
    }

    for (const submenu of submenus) {
      await db.query(
        `INSERT INTO permisos (rol_id, menu_id, submenu_id, puede_ver, puede_crear, puede_editar, puede_eliminar)
         VALUES (?, ?, ?, TRUE, TRUE, TRUE, TRUE)`,
        [adminRol.id, submenu.menu_id, submenu.id]
      );
    }

    console.log('✅ Datos de prueba insertados exitosamente');
    console.log('\n📋 CREDENCIALES DE ACCESO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log('   Email: admin@classoptima.com');
    console.log('   Password: admin123');
    console.log('   DPI: 1234567890101');
    console.log('\n👤 Director:');
    console.log('   Email: director@classoptima.com');
    console.log('   Password: director123');
    console.log('   DPI: 1234567890102');
    console.log('\n👤 Maestro:');
    console.log('   Email: carlos.rodriguez@classoptima.com');
    console.log('   Password: maestro123');
    console.log('   Código: MAE001');
    console.log('\n👤 Alumno:');
    console.log('   Email: jose.garcia@classoptima.com');
    console.log('   Password: alumno123');
    console.log('   Código: ALU001');
    console.log('\n👤 Padre:');
    console.log('   Email: roberto.garcia@classoptima.com');
    console.log('   Password: padre123');
    console.log('   DPI: 1234567890301');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al insertar datos de prueba:', error);
    process.exit(1);
  }
}

insertarDatosPrueba();
