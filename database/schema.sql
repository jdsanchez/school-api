-- Crear base de datos
CREATE DATABASE IF NOT EXISTS school_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE school_management;

-- Tabla de Roles
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) UNIQUE NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Usuarios
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  codigo_alumno VARCHAR(20) UNIQUE NULL,
  dpi VARCHAR(20) UNIQUE NULL,
  telefono VARCHAR(20),
  direccion TEXT,
  fecha_nacimiento DATE,
  genero ENUM('M', 'F', 'Otro'),
  foto_perfil VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id),
  INDEX idx_email (email),
  INDEX idx_codigo_alumno (codigo_alumno),
  INDEX idx_dpi (dpi)
) ENGINE=InnoDB;

-- Tabla de Configuración del Sistema
CREATE TABLE configuracion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre_sistema VARCHAR(100) DEFAULT 'Class Optima',
  logo VARCHAR(255),
  email_contacto VARCHAR(100),
  telefono_contacto VARCHAR(20),
  direccion TEXT,
  tema_color VARCHAR(20) DEFAULT 'blue',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Menús Padre
CREATE TABLE menus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  icono VARCHAR(50),
  ruta VARCHAR(100),
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Submenús
CREATE TABLE submenus (
  id INT PRIMARY KEY AUTO_INCREMENT,
  menu_id INT NOT NULL,
  nombre VARCHAR(50) NOT NULL,
  ruta VARCHAR(100) NOT NULL,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de Permisos (relaciona roles con menús)
CREATE TABLE permisos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rol_id INT NOT NULL,
  menu_id INT NULL,
  submenu_id INT NULL,
  puede_ver BOOLEAN DEFAULT TRUE,
  puede_crear BOOLEAN DEFAULT FALSE,
  puede_editar BOOLEAN DEFAULT FALSE,
  puede_eliminar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (submenu_id) REFERENCES submenus(id) ON DELETE CASCADE,
  UNIQUE KEY unique_permiso (rol_id, menu_id, submenu_id)
) ENGINE=InnoDB;

-- Tabla de Materias
CREATE TABLE materias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  descripcion TEXT,
  grado VARCHAR(50),
  creditos INT DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabla de Asignación de Materias a Maestros
CREATE TABLE maestro_materias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  maestro_id INT NOT NULL,
  materia_id INT NOT NULL,
  ciclo_escolar VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (maestro_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  UNIQUE KEY unique_asignacion (maestro_id, materia_id, ciclo_escolar)
) ENGINE=InnoDB;

-- Tabla de Asistencia
CREATE TABLE asistencia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alumno_id INT NOT NULL,
  materia_id INT NOT NULL,
  fecha DATE NOT NULL,
  estado ENUM('Presente', 'Ausente', 'Tardanza', 'Justificado') NOT NULL,
  observaciones TEXT,
  registrado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id),
  UNIQUE KEY unique_asistencia (alumno_id, materia_id, fecha)
) ENGINE=InnoDB;

-- Tabla de Calificaciones
CREATE TABLE calificaciones (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alumno_id INT NOT NULL,
  materia_id INT NOT NULL,
  periodo VARCHAR(50) NOT NULL,
  tipo_evaluacion VARCHAR(50),
  nota DECIMAL(5,2) NOT NULL,
  nota_maxima DECIMAL(5,2) DEFAULT 100.00,
  fecha_evaluacion DATE,
  observaciones TEXT,
  registrado_por INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (alumno_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- Tabla de Relación Padre-Hijo
CREATE TABLE padre_hijo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  padre_id INT NOT NULL,
  hijo_id INT NOT NULL,
  parentesco ENUM('Padre', 'Madre', 'Tutor', 'Otro') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (padre_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (hijo_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY unique_relacion (padre_id, hijo_id)
) ENGINE=InnoDB;

-- Insertar Roles predefinidos
INSERT INTO roles (nombre, descripcion) VALUES
('Admin', 'Administrador del sistema con acceso completo'),
('Director', 'Director del colegio con permisos administrativos'),
('Maestro', 'Profesor con acceso a materias y calificaciones'),
('Alumno', 'Estudiante con acceso limitado'),
('Padres', 'Padre o tutor con acceso a información de sus hijos');

-- Insertar configuración por defecto
INSERT INTO configuracion (nombre_sistema, logo) VALUES
('Class Optima', '/uploads/logo-default.png');

-- Insertar Menús Padre
INSERT INTO menus (nombre, icono, ruta, orden) VALUES
('Dashboard', 'dashboard', '/dashboard', 1),
('Usuarios', 'users', '/dashboard/usuarios', 2),
('Roles', 'shield', '/dashboard/roles', 3),
('Materias', 'book', '/dashboard/materias', 4),
('Asistencia', 'calendar-check', '/dashboard/asistencia', 5),
('Calificaciones', 'star', '/dashboard/calificaciones', 6),
('Configuración', 'settings', '/dashboard/configuracion', 7);

-- Insertar Submenús
INSERT INTO submenus (menu_id, nombre, ruta, orden) VALUES
-- Usuarios
(2, 'Lista de Usuarios', '/dashboard/usuarios/lista', 1),
(2, 'Nuevo Usuario', '/dashboard/usuarios/nuevo', 2),
-- Roles
(3, 'Lista de Roles', '/dashboard/roles/lista', 1),
(3, 'Nuevo Rol', '/dashboard/roles/nuevo', 2),
(3, 'Permisos', '/dashboard/roles/permisos', 3),
-- Materias
(4, 'Lista de Materias', '/dashboard/materias/lista', 1),
(4, 'Nueva Materia', '/dashboard/materias/nueva', 2),
(4, 'Asignar a Maestros', '/dashboard/materias/asignar', 3),
-- Asistencia
(5, 'Registrar Asistencia', '/dashboard/asistencia/registrar', 1),
(5, 'Ver Reportes', '/dashboard/asistencia/reportes', 2),
-- Calificaciones
(6, 'Registrar Notas', '/dashboard/calificaciones/registrar', 1),
(6, 'Ver Reportes', '/dashboard/calificaciones/reportes', 2),
-- Configuración
(7, 'General', '/dashboard/configuracion/general', 1),
(7, 'Sistema', '/dashboard/configuracion/sistema', 2);

-- Insertar Usuario Administrador (password: admin123)
INSERT INTO usuarios (nombre, apellido, email, password, rol_id, dpi) VALUES
('Administrador', 'Sistema', 'admin@classoptima.com', '$2a$10$YourHashedPasswordHere', 1, '1234567890101');
